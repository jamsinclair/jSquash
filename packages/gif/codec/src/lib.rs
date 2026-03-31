use gif::{DecodeOptions, DisposalMethod};
use wasm_bindgen::prelude::*;
use wasm_bindgen::{Clamped, JsCast};

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
pub struct GIFFrame {
    image_data: ImageData,
    duration: u32,
}

#[wasm_bindgen]
impl GIFFrame {
    #[wasm_bindgen(getter, js_name = "imageData")]
    pub fn image_data(&self) -> ImageData {
        let val: JsValue = self.image_data.clone().into();
        val.unchecked_into()
    }

    #[wasm_bindgen(getter)]
    pub fn duration(&self) -> u32 {
        self.duration
    }
}

fn make_image_data(rgba: Vec<u8>, width: u32, height: u32) -> ImageData {
    ImageData::new_with_owned_u8_clamped_array_and_sh(Clamped(rgba), width, height)
}

fn validate_gif(data: &[u8]) {
    if data.len() < 6 {
        wasm_bindgen::throw_str("Not a valid GIF file (too short)");
    }
    let sig = &data[..6];
    if sig != b"GIF87a" && sig != b"GIF89a" {
        wasm_bindgen::throw_str(
            "Not a valid GIF file (expected GIF87a/GIF89a header)",
        );
    }
}

#[wasm_bindgen]
pub fn decode(data: &[u8]) -> ImageData {
    validate_gif(data);
    let mut opts = DecodeOptions::new();
    opts.set_color_output(gif::ColorOutput::RGBA);
    let mut decoder = opts.read_info(data).unwrap_throw();

    let width = decoder.width() as u32;
    let height = decoder.height() as u32;
    let canvas_size = (width * height * 4) as usize;

    let mut canvas = vec![0u8; canvas_size];

    if let Some(frame) = decoder.read_next_frame().unwrap_throw() {
        let fw = frame.width as u32;
        let fh = frame.height as u32;
        let fl = frame.left as u32;
        let ft = frame.top as u32;

        for y in 0..fh {
            for x in 0..fw {
                let src = ((y * fw + x) * 4) as usize;
                let alpha = frame.buffer[src + 3];
                if alpha == 0 {
                    continue;
                }
                let dx = fl + x;
                let dy = ft + y;
                if dx >= width || dy >= height {
                    continue;
                }
                let dst = ((dy * width + dx) * 4) as usize;
                canvas[dst..dst + 4].copy_from_slice(&frame.buffer[src..src + 4]);
            }
        }
    } else {
        wasm_bindgen::throw_str("No frames found in GIF");
    }

    make_image_data(canvas, width, height)
}

#[wasm_bindgen(js_name = "decodeAnimated")]
pub fn decode_animated(data: &[u8]) -> Vec<GIFFrame> {
    validate_gif(data);
    let mut opts = DecodeOptions::new();
    opts.set_color_output(gif::ColorOutput::RGBA);
    let mut decoder = opts.read_info(data).unwrap_throw();

    let width = decoder.width() as u32;
    let height = decoder.height() as u32;
    let canvas_size = (width * height * 4) as usize;

    let mut canvas = vec![0u8; canvas_size];
    let mut frames: Vec<GIFFrame> = Vec::new();

    while let Some(frame) = decoder.read_next_frame().unwrap_throw() {
        let fw = frame.width as u32;
        let fh = frame.height as u32;
        let fl = frame.left as u32;
        let ft = frame.top as u32;
        let disposal = frame.dispose;

        // Save canvas state before rendering (for restore-to-previous)
        let prev_canvas = if disposal == DisposalMethod::Previous {
            Some(canvas.clone())
        } else {
            None
        };

        // Render frame onto canvas
        for y in 0..fh {
            for x in 0..fw {
                let src = ((y * fw + x) * 4) as usize;
                let alpha = frame.buffer[src + 3];
                if alpha == 0 {
                    continue;
                }
                let dx = fl + x;
                let dy = ft + y;
                if dx >= width || dy >= height {
                    continue;
                }
                let dst = ((dy * width + dx) * 4) as usize;
                canvas[dst..dst + 4].copy_from_slice(&frame.buffer[src..src + 4]);
            }
        }

        // Default delay of 100ms if not specified or zero
        let delay_ms = if frame.delay == 0 {
            100
        } else {
            frame.delay as u32 * 10
        };

        let image_data = make_image_data(canvas.clone(), width, height);
        frames.push(GIFFrame {
            image_data,
            duration: delay_ms,
        });

        // Apply disposal method for next frame
        match disposal {
            DisposalMethod::Background => {
                for y in 0..fh {
                    for x in 0..fw {
                        let dx = fl + x;
                        let dy = ft + y;
                        if dx >= width || dy >= height {
                            continue;
                        }
                        let dst = ((dy * width + dx) * 4) as usize;
                        canvas[dst..dst + 4].copy_from_slice(&[0, 0, 0, 0]);
                    }
                }
            }
            DisposalMethod::Previous => {
                if let Some(prev) = prev_canvas {
                    canvas = prev;
                }
            }
            _ => {} // Keep / Any — leave canvas as-is
        }
    }

    frames
}

#[wasm_bindgen(js_name = "isAnimated")]
pub fn is_animated(data: &[u8]) -> bool {
    validate_gif(data);
    let mut opts = DecodeOptions::new();
    opts.set_color_output(gif::ColorOutput::RGBA);
    let mut decoder = match opts.read_info(data) {
        Ok(d) => d,
        Err(_) => return false,
    };

    // Read first frame
    match decoder.read_next_frame() {
        Ok(Some(_)) => {}
        _ => return false,
    }

    // If there's a second frame, it's animated
    matches!(decoder.read_next_frame(), Ok(Some(_)))
}
