const express = require("express");
const multer = require("multer");
const fs = require("fs");
const path = require("path");
const { google } = require("googleapis");

const app = express();
const PORT = 3000;

// Configuración de Multer (archivos temporales)
const upload = multer({ dest: "temp/" });

// Credenciales OAuth2 (usa tu credentials.json de Google Cloud)
const credentials = require("./credentials.json");
const oAuth2Client = new google.auth.OAuth2(
  credentials.installed.client_id,
  credentials.installed.client_secret,
  credentials.installed.redirect_uris[0]
);

// Token generado previamente (usa OAuth Playground o flujo de autorización)
const token = require("./token.json");
oAuth2Client.setCredentials(token);

// Instancia de Google Drive
const drive = google.drive({ version: "v3", auth: oAuth2Client });

// ID de la carpeta de Drive donde se guardarán los archivos
const FOLDER_ID = "1r99SUqnbgpj8ffQkJpsRxIopb4xQQqsS";

app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));

// Ruta principal
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// Subida de archivo a Drive
app.post("/upload", upload.single("archivo"), async (req, res) => {
  const { titulo, descripcion } = req.body;
  const archivo = req.file;

  try {
    const response = await drive.files.create({
      requestBody: {
        name: archivo.originalname,
        parents: [FOLDER_ID], // 👈 aquí se indica la carpeta destino
        description: descripcion,
        mimeType: archivo.mimetype
      },
      media: {
        mimeType: archivo.mimetype,
        body: fs.createReadStream(archivo.path)
      }
    });

    console.log("Archivo subido a Drive con ID:", response.data.id);
    fs.unlinkSync(archivo.path); // borrar archivo temporal
    res.redirect("/");
  } catch (err) {
    console.error("Error al subir a Drive:", err);
    res.status(500).send("Error al subir el archivo");
  }
});

app.listen(PORT, () => {
  console.log(`Servidor activo en http://localhost:${PORT}`);
});
