#include <opencv2/opencv.hpp>
#include <opencv2/photo.hpp>

extern "C"
{
    void inpaint(int imageWidth, int imageHeight, void* imageData, int maskWidth, int maskHeight, void* maskData, float inpaintingRadius);

    // Callback to JavaScript
    extern void return_image_callback(int width, int height, void* data);
}

void inpaint(int imageWidth, int imageHeight, void* imageData, int maskWidth, int maskHeight, void* maskData, float inpaintingRadius)
{
    cv::Mat image{ imageWidth, imageHeight, CV_8UC4, imageData };
    cv::Mat mask{ maskWidth, maskHeight, CV_8UC4, maskData };

    cv::Mat result = image.clone();

    cv::inpaint(image, mask, result, static_cast<double>(inpaintingRadius), cv::INPAINT_NS);

    return_image_callback(result.size().width, result.size().height, result.data);
}