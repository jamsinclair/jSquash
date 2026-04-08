//
// Copyright © Brooke Vibber
// Some rights reserved.
// 
// Redistribution and use in source and binary forms, with or without
// modification, are permitted provided that the following conditions are met:
// 
// • Redistributions of source code must retain the above copyright notice,
//   this list of conditions and the following disclaimer.
// • Redistributions in binary form must reproduce the above copyright notice,
//   this list of conditions and the following disclaimer in the documentation
//   and/or other materials provided with the distribution.
// 
// THIS SOFTWARE IS PROVIDED BY THE COPYRIGHT HOLDERS AND CONTRIBUTORS "AS IS"
// AND ANY EXPRESS OR IMPLIED WARRANTIES, INCLUDING, BUT NOT LIMITED TO, THE
// IMPLIED WARRANTIES OF MERCHANTABILITY AND FITNESS FOR A PARTICULAR PURPOSE
// ARE DISCLAIMED. IN NO EVENT SHALL THE COPYRIGHT HOLDER OR CONTRIBUTORS BE
// LIABLE FOR ANY DIRECT, INDIRECT, INCIDENTAL, SPECIAL, EXEMPLARY, OR
// CONSEQUENTIAL DAMAGES (INCLUDING, BUT NOT LIMITED TO, PROCUREMENT OF
// SUBSTITUTE GOODS OR SERVICES; LOSS OF USE, DATA, OR PROFITS; OR BUSINESS
// INTERRUPTION) HOWEVER CAUSED AND ON ANY THEORY OF LIABILITY, WHETHER IN
// CONTRACT, STRICT LIABILITY, OR TORT (INCLUDING NEGLIGENCE OR OTHERWISE)
// ARISING IN ANY WAY OUT OF THE USE OF THIS SOFTWARE, EVEN IF ADVISED OF THE
// POSSIBILITY OF SUCH DAMAGE.
//

// turn on all clippy's lints by default
#![warn(clippy::all)]
#![allow(unused_imports)]

// this quiets the compiler about the C constant names
#![allow(non_upper_case_globals)]

// this is triggered by test cases in bindgen code
// where it double-checks the offsets of struct members
#![allow(deref_nullptr)]


use std::convert::TryFrom;
use std::io::{self, Read, Seek, SeekFrom};
use std::ffi::{NulError, c_void};

// Pull in the C library via bindgen
mod jpegxr_sys;
use jpegxr_sys::*;

// For wrapping errors conveniently
use thiserror::Error;

///
/// Result wrapper for the library.
///
pub type Result<T> = std::result::Result<T, JXRError>;

///
/// Error type for the library; consolidates internal errors
/// and incoming errors from I/O and data marshalling.
/// 
#[derive(Error, Debug)]
pub enum JXRError {
    // Rust-side library errors
    #[error("I/O error: {0}")]
    IoError(#[from] io::Error),
    #[error("null byte in string: {0}")]
    NulError(#[from] NulError),
    #[error("numeric conversion error: {0}")]
    TryFromIntError(#[from] std::num::TryFromIntError),

    // Rust-side local errors
    #[error("invalid data")]
    InvalidData,
    #[error("unrecognized pixel format GUID")]
    UnrecognizedPixelFormat,
    #[error("unrecognized color format")]
    UnrecognizedColorFormat,
    #[error("unrecognized photometric interpretation")]
    UnrecognizedInterpretation,
    #[error("unrecognized bit depth")]
    UnrecognizedBitDepth,

    // C-side errors
    #[error("unknown error")]
    UnknownError,
    #[error("fail")]
    Fail,
    #[error("not yet implemented")]
    NotYetImplemented,
    #[error("abstract method")]
    AbstractMethod,
    #[error("out of memory")]
    OutOfMemory,
    #[error("file I/O")]
    FileIO,
    #[error("buffer overflow")]
    BufferOverflow,
    #[error("invalid parameter")]
    InvalidParameter,
    #[error("invalid argument")]
    InvalidArgument,
    #[error("unsupported format")]
    UnsupportedFormat,
    #[error("incorrect codec version")]
    IncorrectCodecVersion,
    #[error("index not found")]
    IndexNotFound,
    #[error("out of sequence")]
    OutOfSequence,
    #[error("not initialized")]
    NotInitialized,
    #[error("must be multiple of 16 lines until last call")]
    MustBeMultipleOf16LinesUntilLastCall,
    #[error("planar alpha banded enc requires temp file")]
    PlanarAlphaBandedEncRequiresTempFile,
    #[error("alpha mode cannot be transcoded")]
    AlphaModeCannotBeTranscoded,
    #[error("incorrect codec sub-version")]
    IncorrectCodecSubVersion
}
use JXRError::*;

///
/// Internal helper: wrap C calls with a ?-friendly Result.
/// 
fn call(err: ERR) -> Result<()> {
    if err >= 0 {
        Ok(())
    } else {
        Err(match err {
            WMP_errFail => Fail,
            WMP_errNotYetImplemented => NotYetImplemented,
            WMP_errAbstractMethod => AbstractMethod,
            WMP_errOutOfMemory => OutOfMemory,
            WMP_errFileIO => FileIO,
            WMP_errBufferOverflow => BufferOverflow,
            WMP_errInvalidParameter => InvalidParameter,
            WMP_errInvalidArgument => InvalidArgument,
            WMP_errUnsupportedFormat => UnsupportedFormat,
            WMP_errIncorrectCodecVersion => IncorrectCodecVersion,
            WMP_errIndexNotFound => IndexNotFound,
            WMP_errOutOfSequence => OutOfSequence,
            WMP_errNotInitialized => NotInitialized,
            WMP_errMustBeMultipleOf16LinesUntilLastCall => MustBeMultipleOf16LinesUntilLastCall,
            WMP_errPlanarAlphaBandedEncRequiresTempFile => PlanarAlphaBandedEncRequiresTempFile,
            WMP_errAlphaModeCannotBeTranscoded => AlphaModeCannotBeTranscoded,
            WMP_errIncorrectCodecSubVersion => IncorrectCodecSubVersion,
            _ => UnknownError
        })
    }
}

///
/// Pixel format enum so you don't have to deal with GUIDs yourself.
/// Naming of these may change before 1.0, be warned.
///
#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum PixelFormat {
    PixelFormatDontCare,

    // Indexed
    PixelFormatBlackWhite,
    PixelFormat8bppGray,

    // sRGB - Rec.709 color primaries, sRGB gamma, SDR only
    PixelFormat16bppRGB555,
    PixelFormat16bppRGB565,
    PixelFormat16bppGray,
    PixelFormat24bppBGR,
    PixelFormat24bppRGB,
    PixelFormat32bppBGR,
    PixelFormat32bppBGRA,
    PixelFormat32bppPBGRA,
    PixelFormat32bppGrayFloat,
    PixelFormat32bppRGB,
    PixelFormat32bppRGBA,
    PixelFormat32bppPRGBA,
    PixelFormat48bppRGBFixedPoint,

    // scRGB - Rect.709 color primaries, linear, HDR-capable
    PixelFormat16bppGrayFixedPoint,
    PixelFormat32bppRGB101010,
    PixelFormat48bppRGB,
    PixelFormat64bppRGBA,
    PixelFormat64bppPRGBA,
    PixelFormat96bppRGBFixedPoint,
    PixelFormat96bppRGBFloat,
    PixelFormat128bppRGBAFloat, // This is used in NVIDIA HDR screenshots
    PixelFormat128bppPRGBAFloat,
    PixelFormat128bppRGBFloat,

    // various...
    PixelFormat32bpp,
    PixelFormat64bppRGBAFixedPoint,
    PixelFormat64bppRGBFixedPoint,
    PixelFormat128bppRGBAFixedPoint,
    PixelFormat128bppRGBFixedPoint,
    PixelFormat64bppRGBAHalf,
    PixelFormat64bppRGBHalf,
    PixelFormat48bppRGBHalf,
    PixelFormat32bppRGBE,
    PixelFormat16bppGrayHalf,
    PixelFormat32bppGrayFixedPoint,

    PixelFormat64bppCMYK,

    PixelFormat24bpp3Channels,
    PixelFormat32bpp4Channels,
    PixelFormat40bpp5Channels,
    PixelFormat48bpp6Channels,
    PixelFormat56bpp7Channels,
    PixelFormat64bpp8Channels,
    
    PixelFormat48bpp3Channels,
    PixelFormat64bpp4Channels,
    PixelFormat80bpp5Channels,
    PixelFormat96bpp6Channels,
    PixelFormat112bpp7Channels,
    PixelFormat128bpp8Channels,
    
    PixelFormat40bppCMYKAlpha,
    PixelFormat80bppCMYKAlpha,
    
    PixelFormat32bpp3ChannelsAlpha,
    PixelFormat40bpp4ChannelsAlpha,
    PixelFormat48bpp5ChannelsAlpha,
    PixelFormat56bpp6ChannelsAlpha,
    PixelFormat64bpp7ChannelsAlpha,
    PixelFormat72bpp8ChannelsAlpha,
    
    PixelFormat64bpp3ChannelsAlpha,
    PixelFormat80bpp4ChannelsAlpha,
    PixelFormat96bpp5ChannelsAlpha,
    PixelFormat112bpp6ChannelsAlpha,
    PixelFormat128bpp7ChannelsAlpha,
    PixelFormat144bpp8ChannelsAlpha,
    
    // YCrCb  from Advanced Profile
    PixelFormat12bppYCC420,
    PixelFormat16bppYCC422,
    PixelFormat20bppYCC422,
    PixelFormat32bppYCC422,
    PixelFormat24bppYCC444,
    PixelFormat30bppYCC444,
    PixelFormat48bppYCC444,
    PixelFormat16bpp48bppYCC444FixedPoint,
    PixelFormat20bppYCC420Alpha,
    PixelFormat24bppYCC422Alpha,
    PixelFormat30bppYCC422Alpha,
    PixelFormat48bppYCC422Alpha,
    PixelFormat32bppYCC444Alpha,
    PixelFormat40bppYCC444Alpha,
    PixelFormat64bppYCC444Alpha,
    PixelFormat64bppYCC444AlphaFixedPoint,
    
    // CMYKDIRECT from Advanced Profile
    PixelFormat32bppCMYKDIRECT,
    PixelFormat64bppCMYKDIRECT,
    PixelFormat40bppCMYKDIRECTAlpha,
    PixelFormat80bppCMYKDIRECTAlpha,
}
use PixelFormat::*;

static GUID_MAP: &[(&GUID, PixelFormat)] = unsafe {
    &[
        (&GUID_PKPixelFormatDontCare, PixelFormatDontCare),
        (&GUID_PKPixelFormatBlackWhite, PixelFormatBlackWhite),
        (&GUID_PKPixelFormat8bppGray, PixelFormat8bppGray),

        // sRGB formats
        (&GUID_PKPixelFormat16bppRGB555, PixelFormat16bppRGB555),
        (&GUID_PKPixelFormat16bppRGB565, PixelFormat16bppRGB565),
        (&GUID_PKPixelFormat16bppGray, PixelFormat16bppGray),
        (&GUID_PKPixelFormat24bppBGR, PixelFormat24bppBGR),
        (&GUID_PKPixelFormat24bppRGB, PixelFormat24bppRGB),
        (&GUID_PKPixelFormat32bppBGR, PixelFormat32bppBGR),
        (&GUID_PKPixelFormat32bppBGRA, PixelFormat32bppBGRA),
        (&GUID_PKPixelFormat32bppPBGRA, PixelFormat32bppPBGRA),
        (&GUID_PKPixelFormat32bppGrayFloat, PixelFormat32bppGrayFloat),
        (&GUID_PKPixelFormat32bppRGB, PixelFormat32bppRGB),
        (&GUID_PKPixelFormat32bppRGBA, PixelFormat32bppRGBA),
        (&GUID_PKPixelFormat32bppPRGBA, PixelFormat32bppPRGBA),
        (&GUID_PKPixelFormat48bppRGBFixedPoint, PixelFormat48bppRGBFixedPoint),

        // scRGB formats
        (&GUID_PKPixelFormat16bppGrayFixedPoint, PixelFormat16bppGrayFixedPoint),
        (&GUID_PKPixelFormat32bppRGB101010, PixelFormat32bppRGB101010),
        (&GUID_PKPixelFormat48bppRGB, PixelFormat48bppRGB),
        (&GUID_PKPixelFormat64bppRGBA, PixelFormat64bppRGBA),
        (&GUID_PKPixelFormat64bppPRGBA, PixelFormat64bppPRGBA),
        (&GUID_PKPixelFormat96bppRGBFixedPoint, PixelFormat96bppRGBFixedPoint),
        (&GUID_PKPixelFormat96bppRGBFloat, PixelFormat96bppRGBFloat),
        (&GUID_PKPixelFormat128bppRGBAFloat, PixelFormat128bppRGBAFloat),
        (&GUID_PKPixelFormat128bppPRGBAFloat, PixelFormat128bppPRGBAFloat),
        (&GUID_PKPixelFormat128bppRGBFloat, PixelFormat128bppRGBFloat),

        // CMYK formats
        (&GUID_PKPixelFormat32bppCMYK, PixelFormat32bpp),
        
        // Photon formats
        (&GUID_PKPixelFormat64bppRGBAFixedPoint, PixelFormat64bppRGBAFixedPoint),
        (&GUID_PKPixelFormat64bppRGBFixedPoint, PixelFormat64bppRGBFixedPoint),
        (&GUID_PKPixelFormat128bppRGBAFixedPoint, PixelFormat128bppRGBAFixedPoint),
        (&GUID_PKPixelFormat128bppRGBFixedPoint, PixelFormat128bppRGBFixedPoint),
        (&GUID_PKPixelFormat64bppRGBAHalf, PixelFormat64bppRGBAHalf),
        (&GUID_PKPixelFormat64bppRGBHalf, PixelFormat64bppRGBHalf),
        (&GUID_PKPixelFormat48bppRGB, PixelFormat48bppRGBHalf),
        (&GUID_PKPixelFormat32bppRGBE, PixelFormat32bppRGBE),
        (&GUID_PKPixelFormat16bppGrayHalf, PixelFormat16bppGrayHalf),
        (&GUID_PKPixelFormat32bppGrayFixedPoint, PixelFormat32bppGrayFixedPoint),

        (&GUID_PKPixelFormat64bppCMYK, PixelFormat64bppCMYK),

        (&GUID_PKPixelFormat24bpp3Channels, PixelFormat24bpp3Channels),
        (&GUID_PKPixelFormat32bpp4Channels, PixelFormat32bpp4Channels),
        (&GUID_PKPixelFormat40bpp5Channels, PixelFormat40bpp5Channels),
        (&GUID_PKPixelFormat48bpp6Channels, PixelFormat48bpp6Channels),
        (&GUID_PKPixelFormat56bpp7Channels, PixelFormat56bpp7Channels),
        (&GUID_PKPixelFormat64bpp8Channels, PixelFormat64bpp8Channels),

        (&GUID_PKPixelFormat48bpp3Channels, PixelFormat48bpp3Channels),
        (&GUID_PKPixelFormat64bpp4Channels, PixelFormat64bpp4Channels),
        (&GUID_PKPixelFormat80bpp5Channels, PixelFormat80bpp5Channels),
        (&GUID_PKPixelFormat96bpp6Channels, PixelFormat96bpp6Channels),
        (&GUID_PKPixelFormat112bpp7Channels, PixelFormat112bpp7Channels),
        (&GUID_PKPixelFormat128bpp8Channels, PixelFormat128bpp8Channels),

        (&GUID_PKPixelFormat40bppCMYKAlpha, PixelFormat40bppCMYKAlpha),
        (&GUID_PKPixelFormat80bppCMYKAlpha, PixelFormat80bppCMYKAlpha),

        (&GUID_PKPixelFormat32bpp3ChannelsAlpha, PixelFormat32bpp3ChannelsAlpha),
        (&GUID_PKPixelFormat40bpp4ChannelsAlpha, PixelFormat40bpp4ChannelsAlpha),
        (&GUID_PKPixelFormat48bpp5ChannelsAlpha, PixelFormat48bpp5ChannelsAlpha),
        (&GUID_PKPixelFormat56bpp6ChannelsAlpha, PixelFormat56bpp6ChannelsAlpha),
        (&GUID_PKPixelFormat64bpp7ChannelsAlpha, PixelFormat64bpp7ChannelsAlpha),
        (&GUID_PKPixelFormat72bpp8ChannelsAlpha, PixelFormat72bpp8ChannelsAlpha),

        (&GUID_PKPixelFormat64bpp3ChannelsAlpha, PixelFormat64bpp3ChannelsAlpha),
        (&GUID_PKPixelFormat80bpp4ChannelsAlpha, PixelFormat80bpp4ChannelsAlpha),
        (&GUID_PKPixelFormat96bpp5ChannelsAlpha, PixelFormat96bpp5ChannelsAlpha),
        (&GUID_PKPixelFormat112bpp6ChannelsAlpha, PixelFormat112bpp6ChannelsAlpha),
        (&GUID_PKPixelFormat128bpp7ChannelsAlpha, PixelFormat128bpp7ChannelsAlpha),
        (&GUID_PKPixelFormat144bpp8ChannelsAlpha, PixelFormat144bpp8ChannelsAlpha),

        /* YCrCb  from Advanced Profile */
        (&GUID_PKPixelFormat12bppYCC420, PixelFormat12bppYCC420),
        (&GUID_PKPixelFormat16bppYCC422, PixelFormat16bppYCC422),
        (&GUID_PKPixelFormat20bppYCC422, PixelFormat20bppYCC422),
        (&GUID_PKPixelFormat32bppYCC422, PixelFormat32bppYCC422),
        (&GUID_PKPixelFormat24bppYCC444, PixelFormat24bppYCC444),
        (&GUID_PKPixelFormat30bppYCC444, PixelFormat30bppYCC444),
        (&GUID_PKPixelFormat48bppYCC444, PixelFormat48bppYCC444),
        (&GUID_PKPixelFormat16bpp48bppYCC444FixedPoint, PixelFormat16bpp48bppYCC444FixedPoint),
        (&GUID_PKPixelFormat20bppYCC420Alpha, PixelFormat20bppYCC420Alpha),
        (&GUID_PKPixelFormat24bppYCC422Alpha, PixelFormat24bppYCC422Alpha),
        (&GUID_PKPixelFormat30bppYCC422Alpha, PixelFormat30bppYCC422Alpha),
        (&GUID_PKPixelFormat48bppYCC422Alpha, PixelFormat48bppYCC422Alpha),
        (&GUID_PKPixelFormat32bppYCC444Alpha, PixelFormat32bppYCC444Alpha),
        (&GUID_PKPixelFormat40bppYCC444Alpha, PixelFormat40bppYCC444Alpha),
        (&GUID_PKPixelFormat64bppYCC444Alpha, PixelFormat64bppYCC444Alpha),
        (&GUID_PKPixelFormat64bppYCC444AlphaFixedPoint, PixelFormat64bppYCC444AlphaFixedPoint),

        /* CMYKDIRECT from Advanced Profile */
        (&GUID_PKPixelFormat32bppCMYKDIRECT, PixelFormat32bppCMYKDIRECT),
        (&GUID_PKPixelFormat64bppCMYKDIRECT, PixelFormat64bppCMYKDIRECT),
        (&GUID_PKPixelFormat40bppCMYKDIRECTAlpha, PixelFormat40bppCMYKDIRECTAlpha),
        (&GUID_PKPixelFormat80bppCMYKDIRECTAlpha, PixelFormat80bppCMYKDIRECTAlpha),
    ]
};

impl PixelFormat {

    fn guid(&self) -> &'static GUID {
        for (map_guid, map_val) in GUID_MAP {
            if self == map_val {
                return map_guid;
            }
        }
        unreachable!("bad pixel format enum")
    }

    fn from_guid(&guid: &GUID) -> Result<Self> {
        for (&map_guid, map_val) in GUID_MAP {
            if guid == map_guid {
                return Ok(*map_val);
            }
        }
        Err(UnrecognizedPixelFormat)
    }

}

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum ColorFormat {
    YOnly,
    YUV420,
    YUV422,
    YUV444,
    CMYK,
    NComponent,
    RGB,
    RGBE
}

impl ColorFormat {
    fn from_raw(raw: COLORFORMAT) -> Result<ColorFormat> {
        match raw {
            COLORFORMAT_Y_ONLY => Ok(ColorFormat::YOnly),
            COLORFORMAT_YUV_420 => Ok(ColorFormat::YUV420),
            COLORFORMAT_YUV_422 => Ok(ColorFormat::YUV422),
            COLORFORMAT_YUV_444 => Ok(ColorFormat::YUV444),
            COLORFORMAT_CMYK => Ok(ColorFormat::CMYK),
            COLORFORMAT_NCOMPONENT => Ok(ColorFormat::NComponent),
            COLORFORMAT_CF_RGB => Ok(ColorFormat::RGB),
            COLORFORMAT_CF_RGBE => Ok(ColorFormat::RGBE),
            _ => Err(UnrecognizedColorFormat)
        }
    }
}

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum PhotometricInterpretation {
    WhiteIsZero,
    BlackIsZero,
    RGB,
    RGBPalette,
    TransparencyMask,
    CMYK,
    YCbCr,
    CIELab,
    NCH,
    RGBE, // shared-exponent
}

impl PhotometricInterpretation {
    fn from_raw(raw: u32) -> Result<PhotometricInterpretation> {
        use PhotometricInterpretation::*;
        match raw {
            PK_PI_W0 => Ok(WhiteIsZero),
            PK_PI_B0 => Ok(BlackIsZero),
            PK_PI_RGB => Ok(RGB),
            PK_PI_RGBPalette => Ok(RGBPalette),
            PK_PI_TransparencyMask => Ok(TransparencyMask),
            PK_PI_CMYK => Ok(CMYK),
            PK_PI_YCbCr => Ok(YCbCr),
            PK_PI_CIELab => Ok(CIELab),
            PK_PI_NCH => Ok(NCH),
            PK_PI_RGBE => Ok(RGBE),
            _ => Err(UnrecognizedInterpretation)
        }
    }
}

#[derive(Debug, Eq, PartialEq, Clone, Copy)]
pub enum BitDepthBits {
    // regular ones
    One, //White is foreground
    Eight,
    Sixteen,
    SixteenS,
    SixteenF,
    ThirtyTwo,
    ThirtyTwoS,
    ThirtyTwoF,

    // irregular ones
    Five,
    Ten,
    FiveSixFive,

    OneAlt, //Black is foreground
}

impl BitDepthBits {
    fn from_raw(raw: BITDEPTH_BITS) -> Result<BitDepthBits> {
        use BitDepthBits::*;
        match raw {
            BITDEPTH_BITS_BD_1 => Ok(One),
            BITDEPTH_BITS_BD_8 => Ok(Eight),
            BITDEPTH_BITS_BD_16 => Ok(Sixteen),
            BITDEPTH_BITS_BD_16S => Ok(SixteenS),
            BITDEPTH_BITS_BD_16F => Ok(SixteenF),
            BITDEPTH_BITS_BD_32 => Ok(ThirtyTwo),
            BITDEPTH_BITS_BD_32S => Ok(ThirtyTwoS),
            BITDEPTH_BITS_BD_32F => Ok(ThirtyTwoF),
            BITDEPTH_BITS_BD_5 => Ok(Five),
            BITDEPTH_BITS_BD_10 => Ok(Ten),
            BITDEPTH_BITS_BD_565 => Ok(FiveSixFive),
            BITDEPTH_BITS_BD_1alt => Ok(OneAlt),
            _ => Err(UnrecognizedBitDepth)
        }
    }
}

pub struct PixelInfo {
    raw: PKPixelInfo
}

impl PixelInfo {

    fn from_guid(guid: &GUID) -> Result<Self> {
        unsafe {
            // It looks wrong to put a pointer into
            // the struct, but it's fine because the
            // entire struct gets overwritten, so the
            // output struct contains a static-lifetime
            // pointer.
            let mut info = PixelInfo {
                raw: std::mem::zeroed()
            };
            info.raw.pGUIDPixFmt = guid;
            call(PixelFormatLookup(&mut info.raw, LOOKUP_FORWARD as u8))?;
            Ok(info)
        }
    }

    fn guid(&self) -> &GUID {
        unsafe {
            &*self.raw.pGUIDPixFmt
        }
    }

    pub fn from_format(format: PixelFormat) -> Self {
        Self::from_guid(format.guid()).unwrap()
    }

    pub fn format(&self) -> PixelFormat {
        PixelFormat::from_guid(self.guid()).unwrap()
    }

    pub fn channels(&self) -> usize {
        self.raw.cChannel
    }

    pub fn color_format(&self) -> ColorFormat {
        ColorFormat::from_raw(self.raw.cfColorFormat).unwrap()
    }
    
    pub fn bit_depth(&self) -> BitDepthBits {
        BitDepthBits::from_raw(self.raw.bdBitDepth).unwrap()
    }

    pub fn bits_per_pixel(&self) -> usize {
        self.raw.cbitUnit as usize
    }

    pub fn has_alpha(&self) -> bool {
        (self.raw.grBit as u32 & PK_pixfmtHasAlpha) != 0
    }

    pub fn premultiplied_alpha(&self) -> bool {
        (self.raw.grBit as u32 & PK_pixfmtPreMul) != 0
    }

    pub fn bgr(&self) -> bool {
        (self.raw.grBit as u32 & PK_pixfmtBGR) != 0
    }

    pub fn photometric_interpretation(&self) -> PhotometricInterpretation {
        PhotometricInterpretation::from_raw(self.raw.uInterpretation).unwrap()
    }

    pub fn samples_per_pixel(&self) -> usize {
        self.raw.uSamplePerPixel as usize
    }
}


///
/// Internal wrapper around a Read + Seek input file
/// into a read-only WMPStream the C library can grok.
///
struct InputStream<R: Read + Seek> {
    raw: Box<WMPStream>,
    reader: Option<Box<R>>
}

impl<R> InputStream<R> where R: Read + Seek {
    fn new(reader: R) -> Self {
        let mut boxed_reader = Box::new(reader);
        let stream = Self {
            raw: Box::new(WMPStream {
                state: WMPStream__bindgen_ty_1 {
                    pvObj: boxed_reader.as_mut() as *mut R as *mut c_void,
                },
                fMem: 0,
                Close: Some(Self::input_stream_close),
                EOS: None, // Not used in library code base!
                Read: Some(Self::input_stream_read),
                Write: Some(Self::input_stream_write),
                SetPos: Some(Self::input_stream_set_pos),
                GetPos: Some(Self::input_stream_get_pos)
            }),
            reader: Some(boxed_reader)
        };
        stream
    }

    pub fn into_reader(mut self) -> R {
        let mut reader: Option<Box<R>> = None;
        std::mem::swap(&mut reader, &mut self.reader);
        *reader.unwrap()
    }

    unsafe fn get_reader(me: *mut WMPStream) -> *mut R {
        std::mem::transmute((*me).state.pvObj)
    }

    unsafe extern "C" fn input_stream_close(_me: *mut *mut WMPStream) -> ERR {
        // Do nothing -- we'll free the reader from the Rust side
        WMP_errSuccess as ERR
    }

    unsafe extern "C" fn input_stream_read(me: *mut WMPStream, dest: *mut c_void, cb: usize) -> ERR {
        let reader = Self::get_reader(me);
        let bytes: *mut u8 = std::mem::transmute(dest);
        let dest_slice = std::slice::from_raw_parts_mut(bytes, cb);
        match (*reader).read_exact(dest_slice) {
            Ok(_) => WMP_errSuccess as ERR,
            Err(_) => WMP_errFileIO as ERR
        }
    }

    unsafe extern "C" fn input_stream_write(_me: *mut WMPStream, _dest: *const c_void, _cb: usize) -> ERR {
        WMP_errFileIO as ERR
    }

    unsafe extern "C" fn input_stream_set_pos(me: *mut WMPStream, off_pos: usize) -> ERR {
        let reader = Self::get_reader(me);
        match (*reader).seek(SeekFrom::Start(off_pos as u64)) {
            Ok(_) => WMP_errSuccess as ERR,
            Err(_) => WMP_errFileIO as ERR
        }
    }

    unsafe extern "C" fn input_stream_get_pos(me: *mut WMPStream, off_pos: *mut usize) -> ERR {
        let reader = Self::get_reader(me);
        match (*reader).stream_position() {
            Ok(pos) => {
                match usize::try_from(pos) {
                    Ok(out) => {
                        *off_pos = out;
                        WMP_errSuccess as ERR
                    },
                    Err(_) => WMP_errFileIO as ERR
                }
            },
            Err(_) => WMP_errFileIO as ERR
        }
    }
}

///
/// Coordinate struct for reading a subset of an image.
/// Pixels are i32.
///
pub struct Rect {
    raw: PKRect
}

impl Rect {
    ///
    /// Create a Rect with the given coordinates.
    ///
    pub fn new(x: i32, y: i32, width: i32, height: i32) -> Self {
        Self {
            raw: PKRect {
                X: x,
                Y: y,
                Width: width,
                Height: height
            }
        }
    }

    ///
    /// Get the X offset.
    ///
    pub fn get_x(&self) -> i32 {
        self.raw.X
    }

    ///
    /// Get the Y offset.
    ///
    pub fn get_y(&self) -> i32 {
        self.raw.Y
    }

    ///
    /// Get the width.
    ///
    pub fn get_width(&self) -> i32 {
        self.raw.Width
    }

    ///
    /// Get the height, in pixels
    ///
    pub fn get_height(&self) -> i32 {
        self.raw.Height
    }
}

///
/// High-level JPEG XR image decoder struct.
/// Requires a seekable data source, such as a File.
/// You can decode multiple subsets of the image,
/// though this is not yet well-tested.
///
pub struct ImageDecode<R: Read + Seek> {
    raw: *mut PKImageDecode,
    stream: Option<InputStream<R>>,
}

impl<R> ImageDecode<R> where R: Read + Seek {

    ///
    /// Create a new JPEG XR image decoder for the given input.
    /// This will consume the reader, and free it when done.
    ///
    pub fn with_reader(reader: R) -> Result<Self> {
        unsafe {
            let mut stream = InputStream::new(reader);

            let mut codec: *mut PKImageDecode = std::ptr::null_mut();
            call(PKImageDecode_Create_WMP(&mut codec as *mut *mut PKImageDecode))?;
            call((*codec).Initialize.unwrap()(codec, stream.raw.as_mut()))?;

            Ok(Self {
                raw: codec,
                stream: Some(stream)
            })
        }
    }

    ///
    /// Return the pixel format of the decoded image.
    /// This is just a big enum; you're responsible for knowing how to
    /// interpret the image data yourself from that.
    /// This could fail if a new unknown pixel type appears in the wild.
    ///
    pub fn get_pixel_format(&self) -> Result<PixelFormat> {
        unsafe {
            let mut guid: GUID = std::mem::zeroed();
            call((*self.raw).GetPixelFormat.unwrap()(self.raw, &mut guid))?;
            PixelFormat::from_guid(&guid)
        }
    }

    ///
    /// Get width and height in pixels.
    ///
    pub fn get_size(&self) -> Result<(i32, i32)> {
        unsafe {
            let mut width: i32 = 0;
            let mut height: i32 = 0;
            call((*self.raw).GetSize.unwrap()(self.raw, &mut width, &mut height))?;
            Ok((width, height))
        }
    }

    ///
    /// Get horizontal and vertical DPI.
    ///
    pub fn get_resolution(&self) -> Result<(f32, f32)> {
        unsafe {
            let mut horiz: f32 = 0.0;
            let mut vert: f32 = 0.0;
            call((*self.raw).GetResolution.unwrap()(self.raw, &mut horiz, &mut vert))?;
            Ok((horiz, vert))
        }
    }

    ///
    /// Decode pixel data and copy it into a provided output buffer.
    /// You can ask for just part of the image to decode fewer macroblocks.
    /// However this mode is not well tested.
    ///
    pub fn copy(&mut self, rect: &Rect, dest: &mut [u8], stride: usize) -> Result<()> {
        let stride_u32 = u32::try_from(stride)?;
        unsafe {
            call((*self.raw).Copy.unwrap()(self.raw, &rect.raw, dest.as_mut_ptr(), stride_u32))?;
            Ok(())
        }
    }

    ///
    /// Decode the entire image in one go, for convenience.
    ///
    pub fn copy_all(&mut self, dest: &mut [u8], stride: usize) -> Result<()> {
        let (width, height) = self.get_size()?;
        let rect = Rect::new(0, 0, width, height);
        self.copy(&rect, dest, stride)
    }

    ///
    /// Free the image decoder and return the input reader.
    /// Only needed if you want to reuse the same reader struct
    /// on something else, but it feels so Rustic!
    ///
    pub fn into_reader(mut self) -> R {
        let mut stream: Option<InputStream<R>> = None;
        std::mem::swap(&mut stream, &mut self.stream);
        stream.unwrap().into_reader()
    }
}

impl<R> Drop for ImageDecode<R> where R: Read + Seek {
    fn drop(&mut self) {
        unsafe {
            // Release the C structure.
            (*self.raw).Release.unwrap()(&mut self.raw);
        }
    }
}

#[cfg(test)]
mod tests {
    use std::fs::{File};
    use crate::ImageDecode;
    use crate::PixelFormat::*;
    use crate::PixelInfo;
    use crate::ColorFormat;
    use crate::BitDepthBits;
    use crate::PhotometricInterpretation;

    #[test]
    fn it_works() {
        let input_result = File::open("samples/panel-hdr.jxr");
        assert!(input_result.is_ok());
        let input = input_result.unwrap();

        let decoder_result = ImageDecode::with_reader(input);
        assert!(decoder_result.is_ok());
        let decoder = decoder_result.unwrap();

        let size_result = decoder.get_size();
        assert!(size_result.is_ok());
        let (width, height) = size_result.unwrap();
        assert_eq!(width, 3440);
        assert_eq!(height, 1440);

        let pixfmt_result = decoder.get_pixel_format();
        assert!(pixfmt_result.is_ok());
        let pixfmt = pixfmt_result.unwrap();
        assert_eq!(pixfmt, PixelFormat128bppRGBAFloat);

        let info = PixelInfo::from_format(pixfmt);
        assert_eq!(info.channels(), 4);
        assert_eq!(info.color_format(), ColorFormat::RGB);
        assert_eq!(info.bit_depth(), BitDepthBits::ThirtyTwoF);
        assert!(info.has_alpha());
        assert!(!info.premultiplied_alpha());
        assert!(!info.bgr());
        assert_eq!(info.photometric_interpretation(), PhotometricInterpretation::RGB);
        assert_eq!(info.samples_per_pixel(), 4);
    }
}
