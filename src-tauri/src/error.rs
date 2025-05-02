use std::fmt::Display;

use color_eyre::eyre;
use serde::{Serialize, ser::Serializer};

// create the error type that represents all errors possible in our program
#[derive(Debug, thiserror::Error)]
pub enum AppError {
    #[error(transparent)]
    IoError(#[from] std::io::Error),
    AudioError(#[from] audiotags::Error),
    WalkDirError(#[from] walkdir::Error),
    UserError(String),
}

// we must manually implement serde::Serialize
impl Serialize for AppError {
    fn serialize<S>(&self, serializer: S) -> Result<S::Ok, S::Error>
    where
        S: Serializer,
    {
        serializer.serialize_str(self.to_string().as_ref())
    }
}

impl Display for AppError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AppError::IoError(err) => write!(f, "IO error: {}", err),
            AppError::AudioError(err) => write!(f, "Audio error: {}", err),
            AppError::WalkDirError(err) => write!(f, "WalkDir error: {}", err),
            AppError::UserError(err) => write!(f, "{}", err),
        }
    }
}

pub type Result<T, E = AppError> = eyre::Result<T, E>;
