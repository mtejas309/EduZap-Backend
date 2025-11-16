export const validateRequest = (req, res, next) => {
  const { name, phone, title } = req.body;

  if (!name || !phone || !title) {
    return res.status(400).json({ error: "Name, phone & title are required." });
  }

  next();
};
