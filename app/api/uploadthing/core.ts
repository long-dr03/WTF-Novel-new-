import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

// FileRouter for your app, can contain multiple FileRoutes
export const ourFileRouter = {
    // Define as many FileRoutes as you like, each with a unique routeSlug
    coverImage: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            // This code runs on your server before upload
            // You can add authentication here if needed
            return {};
        })
        .onUploadComplete(async ({ file }) => {
            // This code RUNS ON YOUR SERVER after upload
            console.log("Cover image uploaded:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    avatarImage: f({
        image: {
            maxFileSize: "2MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            return {};
        })
        .onUploadComplete(async ({ file }) => {
            console.log("Avatar uploaded:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    // For general image uploads
    generalImage: f({
        image: {
            maxFileSize: "8MB",
            maxFileCount: 4,
        },
    })
        .middleware(async () => {
            return {};
        })
        .onUploadComplete(async ({ file }) => {
            console.log("Image uploaded:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
