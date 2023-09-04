#[cfg(feature = "parallel")]
pub use wasm_bindgen_rayon::init_thread_pool;

use oxipng::Interlacing;
use wasm_bindgen::prelude::*;

#[wasm_bindgen]
pub fn optimise(data: &[u8], level: u8, interlace: bool, optimize_alpha: bool) -> Vec<u8> {
    let mut options = oxipng::Options::from_preset(level);
    options.interlace = Some(if interlace { Interlacing::Adam7 } else { Interlacing::None });
    options.optimize_alpha = optimize_alpha;

    oxipng::optimize_from_memory(data, &options).unwrap_throw()
}
