use std::{fmt::Display, num::ParseIntError, str::ParseBoolError};

use serde::{ser::Serializer, Serialize};

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
pub enum SerError {
  #[error(transparent)]
  IoError(#[from] std::io::Error),
  AudioError(#[from] audiotags::Error),
  BaseError(#[from] base64::DecodeError),
  ParseIntError(#[from] ParseIntError),
  ParseBoolError(#[from] ParseBoolError),
}

// we must manually implement serde::Serialize
impl Serialize for SerError {
  fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
  where
    S: Serializer,
  {
    serializer.serialize_str(self.to_string().as_ref())
  }
}

impl Display for SerError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            SerError::IoError(err) => write!(f, "IO error: {}", err),
            SerError::AudioError(err) => write!(f, "Audio error: {}", err),
            SerError::BaseError(err) => write!(f, "Base64 decoding error: {}", err),
            SerError::ParseIntError(err) => write!(f, "ParseInt error: {}", err),
            SerError::ParseBoolError(err) => write!(f, "ParseBool error: {}", err),
        }
    }
}

pub type SerResult<T, E = SerError> = anyhow::Result<T, E>;
