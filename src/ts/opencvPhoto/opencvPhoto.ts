import { DynamicTexture, Scene, Texture } from "babylonjs"

import { DedicatedWorker } from "../shared/dedicatedWorker"
import { OPENCV_PHOTO_URL } from "../shared/constants"

declare var Module: any;
declare function postMessage(data: any): void;

class WasmModule {
    private _worker: Worker;

    private static onInitialized() {
        postMessage({ initialized: true });
    }

    private static onMessage(event: MessageEvent): void {
        const args = event.data;

        if (args.inpaint) {
            let imageBuf = Module._malloc(args.imageData.length * args.imageData.BYTES_PER_ELEMENT);
            Module.HEAPU8.set(args.imageData, imageBuf);

            let maskBuf = Module._malloc(args.maskData.length * args.maskData.BYTES_PER_ELEMENT);
            Module.HEAPU8.set(args.maskData, maskBuf);
            
            var imageData: ImageData;
            Module._return_image_callback = (width: number, height: number, data: number) => {
                let bytes = new Uint8ClampedArray(Module.HEAPU8.subarray(data, data + width * height * 4));
                imageData = new ImageData(bytes, width, height);
            }

            Module._inpaint(
                args.imageWidth, 
                args.imageHeight, 
                imageBuf, 
                args.maskWidth, 
                args.maskHeight, 
                maskBuf, 
                args.radius);

            Module._return_image_callback = () => {};
            Module._free(imageBuf);
            Module._free(maskBuf);
            
            postMessage({
                imageData: imageData
            });
        }
    }
    
    public static CreateAsync(): Promise<WasmModule> {
        return new Promise<WasmModule>((resolve: (tracker: WasmModule) => void) => {
            let tracker = new WasmModule();
            tracker._worker = DedicatedWorker.createFromLocation(
                OPENCV_PHOTO_URL,
                WasmModule.onInitialized,
                WasmModule.onMessage);
            tracker._worker.onmessage = (event: MessageEvent) => {
                tracker._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                resolve(tracker);
            };
        });
    }
    
    public inpaintAsync(image: Texture, mask: Texture, scene: Scene, radius: number): Promise<Texture> {
        const promise = new Promise<Texture>((resolve, reject) => {
            this._worker.onmessage = (result) => {
                this._worker.onmessage = DedicatedWorker.unexpectedMessageHandler;
                
                if (result.data.imageData) {
                    const imageData: ImageData = result.data.imageData;
                    let texture = new DynamicTexture(image.name + "_inpainted", { width: imageData.width, height: imageData.height }, scene, false);
                    texture.getContext().putImageData(imageData, 0, 0);
                    texture.update();
                    resolve(texture);
                }
                else {
                    reject(result.data);
                }
            };
        });


        this._worker.postMessage({
            inpaint: true,
            imageWidth: image.getSize().width,
            imageHeight: image.getSize().height,
            imageData: image.readPixels(),
            maskWidth: mask.getSize().width,
            maskHeight: mask.getSize().height,
            maskData: mask.readPixels(),
            radius: radius
        });

        return promise;
    }
}

export class OpenCVPhoto {
    private static _module: WasmModule;

    public static async InitializeAsync(): Promise<void> {
        OpenCVPhoto._module = await WasmModule.CreateAsync();
    }

    public static async InpaintAsync(image: Texture, mask: Texture, scene: Scene, radius: number = 5.0): Promise<Texture> {
        return await OpenCVPhoto._module.inpaintAsync(image, mask, scene, radius);
    }
}
