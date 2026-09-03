---
license: cc-by-nc-sa-4.0
title: DENTEX Dataset
task_categories:
- object-detection
- image-classification
tags:
- medical
- x-ray
- dental
---

[Paper](https://huggingface.co/papers/2305.19112) | [Code](https://github.com/ibrahimethemhamamci/DENTEX) | [Project Page](https://dentex.grand-challenge.org)

<p align="center">
  <img src="https://huggingface.co/datasets/ibrahimhamamci/DENTEX/resolve/main/figures/dentex.jpg?download=true" width="100%">
</p>

Welcome to the official page of the DENTEX dataset, which has been released as part of the [Dental Enumeration and Diagnosis on Panoramic X-rays Challenge (DENTEX)](https://dentex.grand-challenge.org/), organized in conjunction with the International Conference on Medical Image Computing and Computer-Assisted Intervention (MICCAI) in 2023. The primary objective of this challenge is to develop algorithms that can accurately detect abnormal teeth with dental enumeration and associated diagnosis. This not only aids in accurate treatment planning but also helps practitioners carry out procedures with a low margin of error.

The challenge provides three types of hierarchically annotated data and additional unlabeled X-rays for optional pre-training. The annotation of the data is structured using the Fédération Dentaire Internationale (FDI) system. The first set of data is partially labeled because it only includes quadrant info. The second set of data is also partially labeled but contains additional enumeration information along with the quadrant. The third set is fully labeled because it includes all quadrant-enumeration-diagnosis information for each abnormal tooth, and all participant algorithms have been benchmarked on this third set, with an example output shown below.

<p align="center">
  <img src="https://huggingface.co/datasets/ibrahimhamamci/DENTEX/resolve/main/figures/output.png?download=true" width="100%">
</p>

The DENTEX dataset comprises panoramic dental X-rays obtained from three different institutions using standard clinical conditions but varying equipment and imaging protocols, resulting in diverse image quality reflecting heterogeneous clinical practice. The dataset includes X-rays from patients aged 12 and above, randomly selected from the hospital's database to ensure patient privacy and confidentiality.

To enable effective use of the FDI system, the dataset is hierarchically organized into three types of data:

- (a) 693 X-rays labeled for quadrant detection and quadrant classes only,
- (b) 634 X-rays labeled for tooth detection with quadrant and tooth enumeration classes,
- (c) 1005 X-rays fully labeled for abnormal tooth detection with quadrant, tooth enumeration, and diagnosis classes.

The diagnosis class includes four specific categories: caries, deep caries, periapical lesions, and impacted teeth. An additional 1571 unlabeled X-rays are provided for pre-training. 

<p align="center">
  <img src="https://huggingface.co/datasets/ibrahimhamamci/DENTEX/resolve/main/figures/data.png?download=true" width="100%">
</p>

## Annotation Protocol

The DENTEX dataset provides three hierarchically annotated datasets to support various dental detection tasks: (1) quadrant-only for quadrant detection, (2) quadrant-enumeration for tooth detection, and (3) quadrant-enumeration-diagnosis for abnormal tooth detection. While offering a quadrant detection dataset might appear redundant, it's essential for effectively using the FDI Numbering System. This globally recognized system assigns numbers from 1 through 4 to each mouth quadrant: top right (1), top left (2), bottom left (3), and bottom right (4). Additionally, it numbers each of the eight teeth and each molar from 1 to 8, starting from the front middle tooth and increasing towards the back. For instance, the back tooth on the lower left side is designated as 48 in FDI notation, indicating quadrant 4, tooth 8. Thus, the quadrant segmentation dataset greatly simplifies the dental enumeration task, though evaluations are conducted only on the fully annotated third dataset.

## Data Split for Evaluation and Training

The DENTEX 2023 dataset comprises three types of data: (a) partially annotated quadrant data, (b) partially annotated quadrant-enumeration data, and (c) fully annotated quadrant-enumeration-diagnosis data. The first two types of data are intended for training and development purposes, while the third type is used for training and evaluations.

To comply with standard machine learning practices, the fully annotated third dataset, consisting of 1005 panoramic X-rays, is partitioned into training, validation, and testing subsets, comprising 705, 50, and 250 images, respectively. Ground truth labels are provided only for the training data, while the validation data is provided without associated ground truth. All the ground truth data is now available for researchers.

Note: The datasets are fully identical to the data used for our baseline method, named HierarchicalDet. For more information, please visit the [MICCAI paper](https://conferences.miccai.org/2023/papers/205-Paper2550.html) and the [GitHub repository](https://github.com/ibrahimethemhamamci/DENTEX) of HierarchicalDet (Diffusion-Based Hierarchical Multi-Label Object Detection to Analyze Panoramic Dental X-rays).
## Citing Us
If you use DENTEX, we would appreciate references to the following papers:
```
1. @article{hamamci2023dentex,
  title={DENTEX: An Abnormal Tooth Detection with Dental Enumeration and Diagnosis Benchmark for Panoramic X-rays},
  author={Hamamci, Ibrahim Ethem and Er, Sezgin and Simsar, Enis and Yuksel, Atif Emre and Gultekin, Sadullah and Ozdemir, Serife Damla and Yang, Kaiyuan and Li, Hongwei Bran and Pati, Sarthak and Stadlinger, Bernd and others},
  journal={arXiv preprint arXiv:2305.19112},
  year={2023}
}

2. @inproceedings{hamamci2023diffusion,
  title={Diffusion-based hierarchical multi-label object detection to analyze panoramic dental x-rays},
  author={Hamamci, Ibrahim Ethem and Er, Sezgin and Simsar, Enis and Sekuboyina, Anjany and Gundogar, Mustafa and Stadlinger, Bernd and Mehl, Albert and Menze, Bjoern},
  booktitle={International Conference on Medical Image Computing and Computer-Assisted Intervention},
  pages={389--399},
  year={2023},
  organization={Springer}
}

```
## License
We are committed to fostering innovation and collaboration in the research community. To this end, all elements of the DENTEX dataset are released under a [Creative Commons Attribution (CC-BY-NC-SA) license](https://creativecommons.org/licenses/by-nc-sa/4.0/). This licensing framework ensures that our contributions can be freely used for non-commercial research purposes, while also encouraging contributions and modifications, provided that the original work is properly cited and any derivative works are shared under similar terms.