
const http = require("http");
const fs = require("fs");
const path = require("path");

const PORT = 3000;
const ROOT = __dirname;
const DATA_DIR = path.join(ROOT, "data");
const DATA_FILE = path.join(DATA_DIR, "donations.json");

fs.mkdirSync(DATA_DIR, { recursive: true });

if (!fs.existsSync(DATA_FILE)) {
  fs.writeFileSync(DATA_FILE, "[]", "utf8");
}

function readDonations() {
  const data = JSON.parse(fs.readFileSync(DATA_FILE, "utf8"));

  if (!Array.isArray(data)) {
    throw new Error("donations.json must contain a JSON array.");
  }

  return data;
}

function saveDonations(donations) {
  fs.writeFileSync(
    DATA_FILE,
    JSON.stringify(donations, null, 2),
    "utf8"
  );
}

function sendJSON(res, statusCode, data) {
  res.writeHead(statusCode, {
    "Content-Type": "application/json; charset=utf-8",
    "Cache-Control": "no-store"
  });

  res.end(JSON.stringify(data));
}

function readRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = "";
    let size = 0;

    req.on("data", chunk => {
      size += chunk.length;

      if (size > 100 * 1024) {
        reject(new Error("Request is too large."));
        req.destroy();
        return;
      }

      body += chunk;
    });

    req.on("end", () => {
      try {
        resolve(JSON.parse(body || "{}"));
      } catch {
        reject(new Error("Invalid JSON request."));
      }
    });

    req.on("error", reject);
  });
}

const mimeTypes = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon"
};

const server = http.createServer(async (req, res) => {
  const requestUrl = new URL(
    req.url,
    `http://${req.headers.host || "localhost"}`
  );

  const pathname = requestUrl.pathname;

  try {
    // GET: return all donations
    if (req.method === "GET" && pathname === "/api/donations") {
      return sendJSON(res, 200, readDonations());
    }

    // POST: save a new donation
    if (req.method === "POST" && pathname === "/api/donations") {
      const body = await readRequestBody(req);

      const foodName =
        typeof body.foodName === "string" ? body.foodName.trim() : "";
      const foodType =
        typeof body.foodType === "string" ? body.foodType.trim() : "";
      const pickupLocation =
        typeof body.pickupLocation === "string"
          ? body.pickupLocation.trim()
          : "";
      const donorName =
        typeof body.donorName === "string"
          ? body.donorName.trim()
          : "Donor";
      const donorEmail =
        typeof body.donorEmail === "string"
          ? body.donorEmail.trim().toLowerCase()
          : "";
      const notes = typeof body.notes === "string" ? body.notes.trim() : "";
      const quantity = Number(body.quantity);
      const pickupTime = new Date(body.pickupWindow);

      if (
        !foodName ||
        !foodType ||
        !pickupLocation ||
        !donorEmail ||
        !Number.isInteger(quantity) ||
        quantity < 1 ||
        !Number.isFinite(pickupTime.getTime()) ||
        pickupTime.getTime() <= Date.now()
      ) {
        return sendJSON(res, 400, {
          error: "Please provide valid donation details and a future pickup time."
        });
      }

      const donations = readDonations();

      const donation = {
        id: `FR-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        foodName,
        foodType,
        quantity,
        pickupWindow: pickupTime.toISOString(),
        pickupLocation,
        notes,
        donorName: donorName || "Donor",
        donorEmail,
        status: "Available",
        createdAt: new Date().toISOString()
      };

      donations.push(donation);
      saveDonations(donations);

      return sendJSON(res, 201, {
        message: "Donation saved successfully.",
        donation
      });
    }

    if (pathname.startsWith("/api/")) {
      return sendJSON(res, 404, { error: "API route not found." });
    }

    // Serve the project's HTML, CSS, JavaScript and image files.
    let relativePath;

    try {
      relativePath = decodeURIComponent(pathname);
    } catch {
      res.writeHead(400);
      return res.end("Invalid URL.");
    }

    if (relativePath === "/") {
      relativePath = "/DONOR DASHBOARD.html";
    }

    const filePath = path.resolve(ROOT, "." + relativePath);
    const insideRoot =
      filePath.startsWith(ROOT + path.sep) || filePath === ROOT;

    if (!insideRoot) {
      res.writeHead(403);
      return res.end("Forbidden.");
    }

    fs.stat(filePath, (err, stats) => {
      if (err || !stats.isFile()) {
        res.writeHead(404, { "Content-Type": "text/plain; charset=utf-8" });
        return res.end("File not found.");
      }

      res.writeHead(200, {
        "Content-Type":
          mimeTypes[path.extname(filePath).toLowerCase()] ||
          "application/octet-stream"
      });

      fs.createReadStream(filePath).pipe(res);
    });
  } catch (error) {
    console.error(error);

    if (!res.headersSent) {
      sendJSON(res, 500, {
        error: "Server error. Check server.js and donations.json."
      });
    }
  }
});

server.listen(PORT, () => {
  console.log(`FoodRescue server running at http://localhost:${PORT}`);
});
