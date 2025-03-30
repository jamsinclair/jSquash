use rgb::{
    alt::{GRAY16, GRAY8, GRAYA16, GRAYA8},
    AsPixels, FromSlice, RGB16, RGB8, RGBA16, RGBA8,
};
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

// Custom ImageData bindings to allow construction with
// a JS-owned copy of the data.
#[wasm_bindgen]
extern "C" {
    #[wasm_bindgen(typescript_type = ImageData)]
    pub type ImageData;

    #[wasm_bindgen(constructor)]
    fn new_with_owned_u8_clamped_array_and_sh(
        data: Clamped<Vec<u8>>,
        sw: u32,
        sh: u32,
    ) -> ImageData;
}

#[wasm_bindgen]
pub struct ImageDataRGBA16 {
    width: u32,
    height: u32,
    data: Vec<u16>,
}

#[wasm_bindgen]
impl ImageDataRGBA16 {
    #[wasm_bindgen(getter)]
    pub fn width(&self) -> u32 {
        self.width
    }

    #[wasm_bindgen(getter)]
    pub fn height(&self) -> u32 {
        self.height
    }

    #[wasm_bindgen(getter)]
    pub fn data(&self) -> js_sys::Uint16Array {
        unsafe { js_sys::Uint16Array::view(&self.data) }
    }
}

#[wasm_bindgen]
pub fn encode(data: &[u8], width: u32, height: u32, bit_depth: u8) -> Vec<u8> {
    let mut buffer = Vec::new();

    let encode_bit_depth = match bit_depth {
        8 => png::BitDepth::Eight,
        16 => png::BitDepth::Sixteen,
        _ => panic!("Unsupported bit depth: {}", bit_depth),
    };

    let pixel_size = match encode_bit_depth {
        png::BitDepth::Eight => 4,
        png::BitDepth::Sixteen => 8,
        _ => unreachable!("Unsupported bit depth"),
    };
    let expected_size = (width * height * pixel_size) as usize;
    assert_eq!(
        data.len(),
        expected_size,
        "Data size does not match width, height, and bit depth"
    );

    {
        let mut encoder = png::Encoder::new(&mut buffer, width, height);
        encoder.set_color(png::ColorType::Rgba);
        encoder.set_depth(encode_bit_depth);
        let mut writer = encoder.write_header().unwrap_throw();
        writer.write_image_data(data).unwrap_throw();
    }

    buffer
}

// Convert pixels in-place within buffer containing source data but preallocated
// for entire [num_pixels * sizeof(RGBA)].
// This works because all the color types are <= RGBA by size.
fn expand_pixels<Src: Copy>(buf: &mut Vec<u8>, to_rgba: impl Fn(Src) -> RGBA8, pixel_size: usize)
where
    [u8]: AsPixels<Src> + FromSlice<u8>,
{
    assert!(std::mem::size_of::<Src>() <= std::mem::size_of::<RGBA8>());
    let num_pixels = buf.len() / pixel_size;

    // Resize the buffer to fit the expanded pixels
    buf.resize(num_pixels * std::mem::size_of::<RGBA8>(), 0);

    // Expand the pixels in reverse order to avoid overwriting data
    for i in (0..num_pixels).rev() {
        let src_pixel = buf.as_pixels()[i];
        buf.as_rgba_mut()[i] = to_rgba(src_pixel);
    }
}

fn expand_pixels_rgb16<Src: Copy>(
    buf: &mut Vec<u16>,
    to_rgba: impl Fn(Src) -> RGBA16,
    pixel_size: usize,
) where
    [u16]: AsPixels<Src> + FromSlice<u16>,
{
    assert!(std::mem::size_of::<Src>() <= std::mem::size_of::<RGBA16>());
    let num_pixels = buf.len() / pixel_size;

    // Resize the buffer to fit the expanded pixels
    buf.resize(num_pixels * 4, 0);

    // Expand the pixels in reverse order to avoid overwriting data
    for i in (0..num_pixels).rev() {
        let src_pixel = buf.as_pixels()[i];
        buf.as_rgba_mut()[i] = to_rgba(src_pixel);
    }
}

fn convert_u8_to_u16(buf: &[u8]) -> Vec<u16> {
    let mut u16_buffer = Vec::with_capacity(buf.len());
    u16_buffer.extend(buf.iter().map(|&value| (value as u16) * 257));
    u16_buffer
}

fn buffer_to_u16_iter(buf: &[u8]) -> Vec<u16> {
    buf.chunks_exact(2)
        .map(|chunk| u16::from_be_bytes([chunk[0], chunk[1]]))
        .collect()
}

#[wasm_bindgen]
pub fn decode(mut data: &[u8]) -> ImageData {
    let mut decoder = png::Decoder::new(&mut data);
    decoder.ignore_checksums(true); // Allow images with corrupted checksums ot still be decoded (GH issue #44)
    decoder.set_transformations(
        png::Transformations::EXPAND | // Turn paletted images into RGB
        png::Transformations::STRIP_16, // Turn 16bit into 8 bit
    );
    let mut reader = decoder.read_info().unwrap_throw();
    let mut buf = vec![0; reader.output_buffer_size()];
    let info = reader.next_frame(&mut buf).unwrap_throw();

    // Transformations::EXPAND will expand indexed palettes and lower-bit
    // grayscales to higher color types, but we still need to transform
    // the rest to RGBA.
    match info.color_type {
        png::ColorType::Rgba => {}
        png::ColorType::Rgb => expand_pixels(&mut buf, RGB8::into, 3),
        png::ColorType::GrayscaleAlpha => expand_pixels(&mut buf, GRAYA8::into, 2),
        png::ColorType::Grayscale => {
            expand_pixels(&mut buf, |gray: GRAY8| GRAYA8::from(gray).into(), 1)
        }
        png::ColorType::Indexed => {
            unreachable!("Found indexed color type, but expected it to be already expanded")
        }
    }

    ImageData::new_with_owned_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(buf),
        info.width,
        info.height,
    )
}

// Almost the same as decode, but explicitly outputs pixels as 16bit.
// It can decode both 8bit and 16bit PNGs. 8bit values will be converted to 16bit.
#[wasm_bindgen]
pub fn decode_rgba16(mut data: &[u8]) -> ImageDataRGBA16 {
    let mut decoder = png::Decoder::new(&mut data);
    decoder.ignore_checksums(true);
    decoder.set_transformations(png::Transformations::EXPAND);

    let mut reader = decoder.read_info().unwrap_throw();
    let mut buf = vec![0; reader.output_buffer_size()];
    let info = reader.next_frame(&mut buf).unwrap_throw();

    let mut u16_buffer = match info.bit_depth {
        png::BitDepth::Eight => convert_u8_to_u16(&buf),
        png::BitDepth::Sixteen => buffer_to_u16_iter(&buf),
        _ => {
            panic!("Unsupported bit depth: {:?}", info.bit_depth);
        }
    };

    match info.color_type {
        png::ColorType::Rgba => {}
        png::ColorType::Rgb => expand_pixels_rgb16(&mut u16_buffer, RGB16::into, 3),
        png::ColorType::GrayscaleAlpha => expand_pixels_rgb16(&mut u16_buffer, GRAYA16::into, 2),
        png::ColorType::Grayscale => expand_pixels_rgb16(
            &mut u16_buffer,
            |gray: GRAY16| GRAYA16::from(gray).into(),
            1,
        ),
        png::ColorType::Indexed => {
            unreachable!("Found indexed color type, but expected it to be already expanded")
        }
    }

    ImageDataRGBA16 {
        width: info.width,
        height: info.height,
        data: u16_buffer,
    }
}
