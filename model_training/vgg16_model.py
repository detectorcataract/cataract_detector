from google.colab import drive
drive.mount('/content/drive')

import tensorflow as tf
from tensorflow.keras.applications import VGG16
from tensorflow.keras import layers, models
import matplotlib.pyplot as plt

DATASET_PATH = "/content/drive/MyDrive/preprocessed_data_pad"

IMG_SIZE = (224, 224)
BATCH_SIZE = 32
EPOCHS = 10

MODEL_PATH = "/content/drive/MyDrive/vgg16_cataract.keras"


def create_dataset(directory, shuffle):
    return tf.keras.utils.image_dataset_from_directory(
        directory,
        image_size=IMG_SIZE,
        batch_size=BATCH_SIZE,
        shuffle=shuffle
    )


def load_datasets():
    train_ds = create_dataset(
        f"{DATASET_PATH}/train",
        True
    )

    val_ds = create_dataset(
        f"{DATASET_PATH}/valid",
        False
    )

    test_ds = create_dataset(
        f"{DATASET_PATH}/test",
        False
    )

    train_ds = train_ds.prefetch(tf.data.AUTOTUNE)
    val_ds = val_ds.prefetch(tf.data.AUTOTUNE)
    test_ds = test_ds.prefetch(tf.data.AUTOTUNE)

    return train_ds, val_ds, test_ds


def build_model():

    base_model = VGG16(
        weights="imagenet",
        include_top=False,
        input_shape=(224, 224, 3)
    )

    base_model.trainable = False

    model = models.Sequential([
        base_model,

        layers.GlobalAveragePooling2D(),

        layers.Dense(
            256,
            activation="relu"
        ),

        layers.Dropout(0.5),

        layers.Dense(
            1,
            activation="sigmoid"
        )
    ])

    model.compile(
        optimizer="adam",
        loss="binary_crossentropy",
        metrics=["accuracy"]
    )

    return model


def train_model(model, train_ds, val_ds):

    history = model.fit(
        train_ds,
        validation_data=val_ds,
        epochs=EPOCHS
    )

    return history


def evaluate_model(model, test_ds):

    test_loss, test_accuracy = model.evaluate(
        test_ds
    )

    print(
        f"Test Accuracy: {test_accuracy:.4f}"
    )


def plot_accuracy(history):

    plt.figure(figsize=(8, 5))

    plt.plot(
        history.history["accuracy"],
        label="Training Accuracy"
    )

    plt.plot(
        history.history["val_accuracy"],
        label="Validation Accuracy"
    )

    plt.xlabel("Epoch")
    plt.ylabel("Accuracy")
    plt.title("VGG16 Accuracy")

    plt.legend()

    plt.show()


def main():

    train_ds, val_ds, test_ds = load_datasets()

    model = build_model()

    model.summary()

    history = train_model(
        model,
        train_ds,
        val_ds
    )

    evaluate_model(
        model,
        test_ds
    )

    model.save(
        MODEL_PATH
    )

    plot_accuracy(
        history
    )

import numpy as np
import pandas as pd
import matplotlib.pyplot as plt

from sklearn.metrics import (
    confusion_matrix,
    ConfusionMatrixDisplay,
    classification_report,
    precision_recall_fscore_support,
    accuracy_score,
    roc_auc_score
)

y_true = np.concatenate(
    [labels.numpy() for _, labels in test_ds]
)

y_pred_prob = model.predict(test_ds)

y_pred = (
    y_pred_prob > 0.5
).astype(int).flatten()

cm = confusion_matrix(
    y_true,
    y_pred
)

print("Confusion Matrix:\n")
print(cm)

disp = ConfusionMatrixDisplay(
    confusion_matrix=cm,
    display_labels=test_ds.class_names
)

fig, ax = plt.subplots(figsize=(6, 6))

disp.plot(
    ax=ax,
    cmap="Blues"
)

plt.title("VGG16 Confusion Matrix")

plt.show()

print(
    classification_report(
        y_true,
        y_pred,
        target_names=test_ds.class_names,
        digits=4
    )
)

accuracy = accuracy_score(
    y_true,
    y_pred
)

micro_precision, micro_recall, micro_f1, _ = (
    precision_recall_fscore_support(
        y_true,
        y_pred,
        average="micro"
    )
)

macro_precision, macro_recall, macro_f1, _ = (
    precision_recall_fscore_support(
        y_true,
        y_pred,
        average="macro"
    )
)

weighted_precision, weighted_recall, weighted_f1, _ = (
    precision_recall_fscore_support(
        y_true,
        y_pred,
        average="weighted"
    )
)

tn, fp, fn, tp = cm.ravel()

sensitivity = tp / (tp + fn)

specificity = tn / (tn + fp)

auc = roc_auc_score(
    y_true,
    y_pred_prob
)

summary = pd.DataFrame(
    {
        "Precision": [
            micro_precision,
            macro_precision,
            weighted_precision
        ],
        "Recall": [
            micro_recall,
            macro_recall,
            weighted_recall
        ],
        "F1-Score": [
            micro_f1,
            macro_f1,
            weighted_f1
        ]
    },
    index=[
        "Micro",
        "Macro",
        "Weighted"
    ]
)

print(f"\nAccuracy     : {accuracy:.4f}")
print(f"Sensitivity  : {sensitivity:.4f}")
print(f"Specificity  : {specificity:.4f}")
print(f"AUC Score    : {auc:.4f}")

print("\nAverage Metrics:\n")

print(summary.round(4))