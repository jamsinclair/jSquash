use magic_kernel::{magic_resize, ImageF64, Version};
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

const RGBA_CHANNEL_SIZE: u8 = 4;

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

fn convert_from_rgba_u8_slice(data: &[u8], width: usize, height: usize) -> ImageF64 {
    let data_f64: Vec<_> = data.iter().map(|x| *x as f64).collect();
    ImageF64::new(data_f64, RGBA_CHANNEL_SIZE, width as u32, height as u32)
}

fn get_version_from_string(version: String) -> Version {
    if version == "magicKernelSharp2021" {
        return Version::MagicKernelSharp2021;
    }

    if version == "magicKernelSharp2013" {
        return Version::MagicKernelSharp2013;
    }

    if version == "magicKernel" {
        return Version::MagicKernel;
    }

    panic!("Version not recognized: {}", version);
}

#[wasm_bindgen]
pub fn resize(
    data: &[u8],
    input_width: usize,
    input_height: usize,
    output_width: usize,
    output_height: usize,
    version: String
) -> ImageData {
    let resized = magic_resize(
        &convert_from_rgba_u8_slice(data, input_width, input_height),
        get_version_from_string(version),
        Some(output_width as u32),
        Some(output_height as u32),
    );

    let buf: Vec<_> = resized.into();
    let buf: Vec<u8> = buf.iter().map(|x| *x as u8).collect();

    
    ImageData::new_with_owned_u8_clamped_array_and_sh(
        wasm_bindgen::Clamped(buf),
        output_width as u32,
        output_height as u32,
    )
}
