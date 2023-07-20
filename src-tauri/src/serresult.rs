use std::fmt::Display;

use serde::{ser::Serializer, Deserialize, Serialize};

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
pub enum SerError {
  #[error(transparent)]
  IoError(#[from] std::io::Error),
  AudioError(#[from] audiotags::Error),
  BaseError(#[from] base64::DecodeError),
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
        write!(f, "{}", self)
    }
}

pub type SerResult<T, E = SerError> = anyhow::Result<T, E>;
