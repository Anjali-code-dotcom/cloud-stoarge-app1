import express from "express";
import cors from "cors";
import multer from "multer";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// ==========================
// BASIC TEST ROUTE ✅ (404 DEBUG FIX)
// ==========================
app.get("/", (req, res) => {
  res.send("✅ API is running...");
});

// ==========================
// ENV CHECK
// ==========================
if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
  console.error("❌ Missing Supabase ENV variables");
  process.exit(1);
}

// ==========================
// SUPABASE CLIENT
// ==========================
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ==========================
// MIDDLEWARE
// ==========================
app.use(cors({ origin: "*" }));
app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 500 * 1024 * 1024 },
});

// ==========================
// AUTH MIDDLEWARE
// ==========================
async function requireAuth(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ error: "Unauthorized" });
    }

    const token = authHeader.split(" ")[1];

    const { data, error } = await supabase.auth.getUser(token);

    if (error || !data.user) {
      return res.status(401).json({ error: "Invalid token" });
    }

    req.user = data.user;
    next();
  } catch (err) {
    console.error("🔥 Auth error:", err);
    res.status(500).json({ error: "Auth failed" });
  }
}

// ==========================
// UPLOAD FILE
// ==========================
app.post("/api/files/upload", requireAuth, upload.single("file"), async (req, res) => {
  try {
    const file = req.file;
    const { folder_id } = req.body;

    if (!file) return res.status(400).json({ error: "No file provided" });

    console.log("📁 Uploading:", file.originalname);

    const safeName = file.originalname.replace(/\s+/g, "_");
    const filePath = `${req.user.id}/${Date.now()}_${safeName}`;

    // Upload to storage
    const { error: uploadError } = await supabase.storage
      .from("user-files")
      .upload(filePath, file.buffer, {
        contentType: file.mimetype,
      });

    if (uploadError) {
      console.error("❌ Storage error:", uploadError);
      return res.status(500).json({ error: uploadError.message });
    }

    // Save in DB
    const { data, error } = await supabase
      .from("files")
      .insert({
        name: file.originalname,
        size: file.size,
        folder_id: folder_id || null,
        user_id: req.user.id,
        storage_path: filePath,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ DB error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ file: data });

  } catch (err) {
    console.error("🔥 Upload crash:", err);
    res.status(500).json({ error: "Upload failed" });
  }
});

// ==========================
// GET FILES
// ==========================
app.get("/api/files", requireAuth, async (req, res) => {
  try {
    const { folder_id, search } = req.query;

    let query = supabase
      .from("files")
      .select("*")
      .eq("user_id", req.user.id);

    if (folder_id) {
      query = query.eq("folder_id", folder_id);
    }

    if (search) {
      query = query.ilike("name", `%${search}%`);
    }

    const { data, error } = await query;

    if (error) {
      console.error("❌ Files error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ files: data || [] });

  } catch (err) {
    console.error("🔥 Files crash:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ==========================
// GET FOLDERS ✅ (YOUR 404 FIX)
// ==========================
app.get("/api/folders", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("folders")
      .select("*")
      .eq("user_id", req.user.id);

    if (error) {
      console.error("❌ Folder error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ folders: data || [] });

  } catch (err) {
    console.error("🔥 Folder crash:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});

// ==========================
// CREATE FOLDER
// ==========================
app.post("/api/folders", requireAuth, async (req, res) => {
  try {
    const { name, parent_id } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Folder name required" });
    }

    const { data, error } = await supabase
      .from("folders")
      .insert({
        user_id: req.user.id,
        name,
        parent_id: parent_id || null,
      })
      .select()
      .single();

    if (error) {
      console.error("❌ Create folder error:", error);
      return res.status(500).json({ error: error.message });
    }

    res.json({ folder: data });

  } catch (err) {
    console.error("🔥 Folder create crash:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ==========================
// DOWNLOAD FILE
// ==========================
app.get("/api/files/:id/download", requireAuth, async (req, res) => {
  try {
    const { data: file } = await supabase
      .from("files")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (!file) return res.status(404).json({ error: "File not found" });

    const { data, error } = await supabase.storage
      .from("user-files")
      .createSignedUrl(file.storage_path, 3600);

    if (error) return res.status(500).json({ error: error.message });

    res.json({ url: data.signedUrl });

  } catch (err) {
    console.error("🔥 Download crash:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ==========================
// DELETE FILE
// ==========================
app.delete("/api/files/:id", requireAuth, async (req, res) => {
  try {
    const { data: file } = await supabase
      .from("files")
      .select("*")
      .eq("id", req.params.id)
      .eq("user_id", req.user.id)
      .single();

    if (!file) return res.status(404).json({ error: "File not found" });

    await supabase.storage.from("user-files").remove([file.storage_path]);
    await supabase.from("files").delete().eq("id", req.params.id);

    res.json({ success: true });

  } catch (err) {
    console.error("🔥 Delete crash:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

// ==========================
// START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
// ==========================
// USAGE API ✅ FIX
// ==========================
app.get("/api/usage", requireAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from("files")
      .select("size")
      .eq("user_id", req.user.id);

    if (error) {
      console.error("❌ Usage error:", error);
      return res.status(500).json({ error: error.message });
    }

    const total = (data || []).reduce((sum, f) => sum + (f.size || 0), 0);

    res.json({
      used_bytes: total,
      used_gb: (total / 1e9).toFixed(2),
      limit_gb: 10,
    });

  } catch (err) {
    console.error("🔥 Usage crash:", err);
    res.status(500).json({ error: "Internal server error" });
  }
});