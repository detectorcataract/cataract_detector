
from __future__ import annotations

import json
import os
from functools import lru_cache
from io import BytesIO
from pathlib import Path
from typing import Any, Literal

import numpy as np
from PIL import Image
from tensorflow import keras
from tensorflow.keras.applications.mobilenet_v2 import preprocess_input as mobilenetv2_preprocess
from tensorflow.keras.applications.resnet50 import preprocess_input as resnet50_preprocess


PROJECT_ROOT = Path(__file__).resolve().parents[1]
MODEL_DIR = PROJECT_ROOT / "models"

DEFAULT_RESNET50_MODEL_PATH = Path(
    os.getenv("RESNET50_MODEL_PATH", MODEL_DIR / "cataract_resnet50.keras")
)
DEFAULT_MOBILENETV2_MODEL_PATH = Path(
    os.getenv("MOBILENETV2_MODEL_PATH", MODEL_DIR / "cataract_mobilenetv2.keras")
)
DEFAULT_LABELS_PATH = Path(os.getenv("LABELS_PATH", MODEL_DIR / "cataract_labels.json"))

IMG_SIZE = (224, 224)
PreprocessingMode = Literal["embedded", "resnet50", "mobilenetv2", "none"]


def predict_cataract(
    image: str | Path | bytes | bytearray | Image.Image | np.ndarray,
    resnet50_model_path: str | Path = DEFAULT_RESNET50_MODEL_PATH,
    mobilenetv2_model_path: str | Path = DEFAULT_MOBILENETV2_MODEL_PATH,
    labels_path: str | Path = DEFAULT_LABELS_PATH,
    *,
    resnet50_preprocessing: PreprocessingMode = "embedded",
    mobilenetv2_preprocessing: PreprocessingMode = "embedded",
) -> dict[str, Any]:

    labels = _load_labels(Path(labels_path))
    resnet_model = _load_model(Path(resnet50_model_path))
    mobilenet_model = _load_model(Path(mobilenetv2_model_path))

    image_batch = _load_image_batch(image)
    resnet_batch = _preprocess_batch(image_batch, resnet50_preprocessing)
    mobilenet_batch = _preprocess_batch(image_batch, mobilenetv2_preprocessing)

    resnet_probs = _predict_probabilities(resnet_model, resnet_batch, "ResNet50")
    mobilenet_probs = _predict_probabilities(mobilenet_model, mobilenet_batch, "MobileNetV2")

    _validate_probabilities(resnet_probs, labels, "ResNet50")
    _validate_probabilities(mobilenet_probs, labels, "MobileNetV2")

    ensemble_probs = (resnet_probs + mobilenet_probs) / 2.0
    class_index = int(np.argmax(ensemble_probs))
    confidence = float(ensemble_probs[class_index])

    return {
        "label": labels[class_index],
        "confidence": round(confidence, 4),
        "class_index": class_index,
        "probabilities": _probability_map(labels, ensemble_probs),
        "model_probabilities": {
            "resnet50": _probability_map(labels, resnet_probs),
            "mobilenetv2": _probability_map(labels, mobilenet_probs),
        },
    }


@lru_cache(maxsize=4)
def _load_model(model_path: Path) -> keras.Model:
    if not model_path.exists():
        raise FileNotFoundError(f"Model file not found: {model_path}")
    return keras.models.load_model(model_path)


@lru_cache(maxsize=2)
def _load_labels(labels_path: Path) -> list[str]:
    if not labels_path.exists():
        raise FileNotFoundError(f"Labels file not found: {labels_path}")

    data = json.loads(labels_path.read_text())
    labels = data.get("class_names")
    if not isinstance(labels, list) or not labels:
        raise ValueError(f"Expected {labels_path} to contain a non-empty 'class_names' list.")
    return [str(label) for label in labels]


def _load_image_batch(
    image: str | Path | bytes | bytearray | Image.Image | np.ndarray,
) -> np.ndarray:
    pil_image = _to_pil_image(image).convert("RGB")
    pil_image = pil_image.resize(IMG_SIZE, Image.Resampling.BILINEAR)
    array = keras.utils.img_to_array(pil_image, dtype="float32")
    return np.expand_dims(array, axis=0)


def _to_pil_image(image: str | Path | bytes | bytearray | Image.Image | np.ndarray) -> Image.Image:
    if isinstance(image, Image.Image):
        return image

    if isinstance(image, (str, Path)):
        return Image.open(image)

    if isinstance(image, (bytes, bytearray)):
        return Image.open(BytesIO(image))

    if isinstance(image, np.ndarray):
        return Image.fromarray(_normalize_array_for_pil(image))

    raise TypeError(
        "image must be a path, bytes, PIL.Image.Image, or numpy.ndarray; "
        f"got {type(image).__name__}"
    )


def _normalize_array_for_pil(array: np.ndarray) -> np.ndarray:
    array = np.asarray(array)
    if array.ndim not in (2, 3):
        raise ValueError(f"Expected a 2D or 3D image array, got shape {array.shape}")

    if np.issubdtype(array.dtype, np.floating):
        max_value = float(np.nanmax(array)) if array.size else 0.0
        if max_value <= 1.0:
            array = array * 255.0
        array = np.clip(array, 0.0, 255.0)

    return array.astype(np.uint8)


def _preprocess_batch(batch: np.ndarray, mode: PreprocessingMode) -> np.ndarray:
    batch = batch.copy()

    if mode in ("embedded", "none"):
        return batch
    if mode == "resnet50":
        return resnet50_preprocess(batch)
    if mode == "mobilenetv2":
        return mobilenetv2_preprocess(batch)

    raise ValueError(
        "preprocessing mode must be one of: 'embedded', 'none', 'resnet50', 'mobilenetv2'"
    )


def _predict_probabilities(model: keras.Model, batch: np.ndarray, model_name: str) -> np.ndarray:
    predictions = np.asarray(model.predict(batch, verbose=0), dtype=np.float32)
    if predictions.ndim != 2 or predictions.shape[0] != 1:
        raise ValueError(
            f"{model_name} returned predictions with shape {predictions.shape}; "
            "expected (1, num_classes)."
        )
    return predictions[0]


def _validate_probabilities(probabilities: np.ndarray, labels: list[str], model_name: str) -> None:
    if probabilities.shape[0] != len(labels):
        raise ValueError(
            f"{model_name} returned {probabilities.shape[0]} classes, but labels contain "
            f"{len(labels)} classes."
        )


def _probability_map(labels: list[str], probabilities: np.ndarray) -> dict[str, float]:
    return {
        label: round(float(probability), 4)
        for label, probability in zip(labels, probabilities)
    }


# Backwards-compatible alias for callers that expect a generic predict function.
predict = predict_cataract
