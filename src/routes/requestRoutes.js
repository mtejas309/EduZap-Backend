import express from "express";
import Request from "../models/RequestModel.js";
import cache from "../services/cache.js";
import multer from "multer";
import path from "path";

const router = express.Router();

const storage = multer.memoryStorage();

const upload = multer({ storage });

const requestCacheKeys = new Set();

router.post("/request", upload.single("image"), async (req, res) => {
  try {
    const existing = await Request.findOne({ phone: req.body.phone });
    if (existing) {
      return res.status(400).json({ error: "Phone number already exists" });
    }

    const newReq = await Request.create({
      name: req.body.name,
      phone: req.body.phone,
      title: req.body.title,
      image: req.file
        ? { data: req.file.buffer, contentType: req.file.mimetype }
        : null,
    });

    clearRequestsCache();
    res.status(201).json({ message: "Request saved", data: newReq });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
router.get("/request/image/:id", async (req, res) => {
  const reqData = await Request.findById(req.params.id);

  if (!reqData || !reqData.image) {
    return res.status(404).send("Image not found");
  }

  res.set("Content-Type", reqData.image.contentType);
  res.send(reqData.image.data);
});

router.get("/requests", async (req, res) => {
  try {
    const {
      search = "",
      page = 1,
      limit = 10,
      sortBy = "title",
      order = "asc",
    } = req.query;

    const cacheKey = `requests:${search}:${page}:${limit}:${sortBy}:${order}`;
    const cached = cache.get(cacheKey);

    if (cached) {
      return res.json({ source: "cache", ...cached });
    }

    // Search only by title
    let query = {};
    if (search) {
      query = { title: { $regex: search, $options: "i" } };
    }

    // Sorting
    const sortOrder = order === "desc" ? -1 : 1;
    const sortOptions = { [sortBy]: sortOrder };

    const skip = (parseInt(page) - 1) * parseInt(limit);

    const [data, total] = await Promise.all([
      Request.find(query)
        .sort(sortOptions)
        .skip(skip)
        .limit(parseInt(limit))
        .lean(),
      Request.countDocuments(query),
    ]);

    const result = {
      data,
      pagination: {
        currentPage: parseInt(page),
        totalPages: Math.ceil(total / parseInt(limit)),
        totalItems: total,
        itemsPerPage: parseInt(limit),
      },
    };

    cache.set(cacheKey, result);
    requestCacheKeys.add(cacheKey);

    return res.json({ source: "database", ...result });
  } catch (error) {
    res.status(500).json({ error: "Server Error", details: error.message });
  }
});

router.delete("/request/:id", async (req, res) => {
  try {
    const deleted = await Request.findByIdAndDelete(req.params.id);

    if (!deleted) {
      return res.status(404).json({ error: "Request not found" });
    }

    clearRequestsCache();

    res.json({ message: "Request deleted", data: deleted });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

function clearRequestsCache() {
  requestCacheKeys.forEach((key) => {
    cache.del(key);
  });
  requestCacheKeys.clear();
}

export default router;
