#include <opencv2/opencv.hpp>
#include <opencv2/photo.hpp>

#include <iostream>

extern "C"
{
    void inpaint(int imageWidth, int imageHeight, void* imageData, int maskWidth, int maskHeight, void* maskData, float inpaintingRadius);

    // Callback to JavaScript
    extern void return_image_callback(int width, int height, void* data);
}

void inpaint(int imageWidth, int imageHeight, void* imageData, int maskWidth, int maskHeight, void* maskData, float inpaintingRadius)
{
    cv::Mat inputImage{ imageHeight, imageWidth, CV_8UC4, imageData };
    cv::Mat inputMask{ maskHeight, maskWidth, CV_8UC4, maskData };

    cv::Mat image{};
    cv::cvtColor(inputImage, image, cv::COLOR_RGBA2RGB);

    cv::Mat mask{};
    cv::cvtColor(inputMask, mask, cv::COLOR_RGBA2GRAY);

    cv::Mat result{ imageHeight, imageWidth, CV_8UC3 };

    cv::inpaint(image, mask, result, static_cast<double>(inpaintingRadius), cv::INPAINT_NS);

    cv::Mat output{};
    cv::cvtColor(result, output, cv::COLOR_RGB2RGBA);
    return_image_callback(output.size().width, output.size().height, output.data);
}