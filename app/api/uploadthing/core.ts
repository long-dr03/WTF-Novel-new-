import { createUploadthing, type FileRouter } from "uploadthing/next";

const f = createUploadthing();

export const ourFileRouter = {
    coverImage: f({
        image: {
            maxFileSize: "4MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            return {};
        })
        .onUploadComplete(async ({ file }) => {
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

    chapterAudio: f({
        audio: {
            maxFileSize: "32MB",
            maxFileCount: 1,
        },
    })
        .middleware(async () => {
            return {};
        })
        .onUploadComplete(async ({ file }) => {
            console.log("Chapter audio uploaded:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),

    backgroundMusic: f({
        audio: {
            maxFileSize: "64MB",
            maxFileCount: 5,
        },
    })
        .middleware(async () => {
            return {};
        })
        .onUploadComplete(async ({ file }) => {
            console.log("Background music uploaded:", file.ufsUrl);
            return { url: file.ufsUrl };
        }),
} satisfies FileRouter;

export type OurFileRouter = typeof ourFileRouter;
