import { BlobServiceClient, ContainerClient } from '@azure/storage-blob';

//const sasToken = process.env.storagesastoken || ""; // Fill string with your SAS token
const containerName = `upload-images`;
//const storageAccountName = process.env.storageresourcename || ""; // Fill string with your Storage resource name

// Feature flag - disable storage feature to app if not configured
//export const isStorageConfigured = () => {
//    return (!storageAccountName || !sasToken) ? false : true;
//}

// return list of blobs in container to display
//const getBlobsInContainer = async (containerClient: ContainerClient) => {
//  const returnedBlobUrls: string[] = [];

//  // get list of blobs in container
//  // eslint-disable-next-line
//  for await (const blob of containerClient.listBlobsFlat()) {
//    // if image is public, just construct URL
//    returnedBlobUrls.push(
//      `https://${storageAccountName}.blob.core.windows.net/${containerName}/${blob.name}`
//    );
//  }

//  return returnedBlobUrls;
//}

const createBlobInContainer = async (containerClient: ContainerClient, file: File) => {

    // create blobClient for container
    const blobClient = containerClient.getBlockBlobClient(Date.now() + file.name);

    // upload file
    await blobClient.uploadData(file, {
        blobHTTPHeaders: { blobContentType: file.type },
        metadata: {
            filename: file.name
        }
    });

    return blobClient.url;
}

const uploadFileToBlob = async (file: File | null, sasUrl: string): Promise<string | null> => {
    if (!file) return null;

    // get BlobService = notice `?` is pulled out of sasToken - if created in Azure portal
    const blobService = new BlobServiceClient(
        sasUrl
        //`https://${storageAccountName}.blob.core.windows.net/?${sasToken}`
    );

    // get Container - full public read access
    const containerClient: ContainerClient = blobService.getContainerClient(containerName);
    //await containerClient.createIfNotExists({
    //    access: 'container',
    //});

    // upload file
    return await createBlobInContainer(containerClient, file);

    // get list of blobs in container
    //return getBlobsInContainer(containerClient);
};

export default uploadFileToBlob;