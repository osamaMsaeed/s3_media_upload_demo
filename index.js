import { config } from "./config.js"; //if not importing not works, use vs code live-server extension

const file = document.getElementById("input-media");
const upload = document.getElementById("upload");

upload.addEventListener("click", async () => {
  let selectFile = file.files[0];

  const fr = new FileReader();
  fr.readAsArrayBuffer(selectFile);

  fr.onload = async function () {
    let blob = new Blob([fr.result]);
    try {
      const res = await fetch(`${config.BASE_URL}/media/init`, {
        method: "POST",
        headers: {
          Authorization: config.AUTH_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: "string.jpg",
          size: 10,
          type: "IMAGE",
          public: false,
        }),
      });

      const credentials = await res.json();

      const uploadedItem = await uploadOnS3(blob, credentials);

      await fetch(`${config.BASE_URL}/media/finalize`, {
        method: "POST",
        headers: {
          Authorization: config.AUTH_TOKEN,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id: Number(credentials.mediaId),
        }),
      });
    } catch (err) {
      console.log("err", err);
    }
  };

  const uploadOnS3 = async (stream, credentials, cb) => {
    if (!window.AWS) {
      return;
    }

    window.AWS.config.update({ region: credentials.region });

    let s3 = new window.AWS.S3({
      credentials: new window.AWS.Credentials({
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        sessionToken: credentials.sessionToken,
        signatureVersion: "v4",
        region: credentials.region,
      }),
    });

    let uploadedItem = await s3
      .upload(
        {
          Bucket: credentials.bucket,
          Key: credentials.location,
          ACL: "public-read",
          Body: stream,
        },
        function (err, data) {
          console.log(err, data);
        }
      )
      .promise();

    return uploadedItem;
  };
});
