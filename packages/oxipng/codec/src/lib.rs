#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

use oxipng::{BitDepth, ColorType, Interlacing};
use wasm_bindgen::prelude::*;
use wasm_bindgen::Clamped;

#[wasm_bindgen]
pub fn optimise(data: &[u8], level: u8, interlace: bool, optimize_alpha: bool) -> Vec<u8> {
    let mut options = oxipng::Options::from_preset(level);
    options.interlace = Some(if interlace {
        Interlacing::Adam7
    } else {
        Interlacing::None
    });
    options.optimize_alpha = optimize_alpha;

    oxipng::optimize_from_memory(data, &options).unwrap_throw()
}

#[wasm_bindgen]
pub fn optimise_raw(
    data: Clamped<Vec<u8>>,
    width: u32,
    height: u32,
    level: u8,
    interlace: bool,
    optimize_alpha: bool,
) -> Vec<u8> {
    let mut options = oxipng::Options::from_preset(level);
    options.interlace = Some(if interlace {
        Interlacing::Adam7
    } else {
        Interlacing::None
    });
    options.optimize_alpha = optimize_alpha;

    let raw = oxipng::RawImage::new(width, height, ColorType::RGBA, BitDepth::Eight, data.0)
        .unwrap_throw();
    raw.create_optimized_png(&options).unwrap_throw()
}
