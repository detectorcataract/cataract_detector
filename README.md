# cataract_detector

ResNet50-based cataract detection model training for chatbot image uploads.

## Training

1. Put preprocessed images in your already-created 70/15/15 split folders, for example:

```text
cataract_dataset/
  train/
    cataract/
    normal/
  validation/
    cataract/
    normal/
  test/
    cataract/
    normal/
```

2. Install dependencies:

```bash
pip install -r requirements.txt
```

3. Open `model_training.ipynb`, update `DATASET_DIR` if needed, and run the notebook. It trains for 10 epochs and saves:

- `models/cataract_resnet50.keras`
- `models/cataract_labels.json`
- `models/training_history.json`

The final notebook cell includes `predict_uploaded_image(...)`, which can be reused in the chatbot backend for uploaded eye images.
