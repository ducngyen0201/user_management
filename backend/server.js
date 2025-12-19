const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const app = express();

app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb+srv://20225192:20225192@cluster0.fvkfjaf.mongodb.net/it4409")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("MongoDB Error:", err));

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Tên không được để trống"],
      minlength: [2, "Tên phải có ít nhất 2 ký tự"],
      trim: true,
    },
    age: {
      type: Number,
      required: [true, "Tuổi không được để trống"],
      min: [0, "Tuổi phải lớn hơn hoặc bằng 0"],
    },
    email: {
      type: String,
      required: [true, "Email không được để trống"],
      unique: true,
      match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
      trim: true,
    },
    address: {
      type: String,
      trim: true,
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);

app.get("/api/users", async (req, res) => {
  try {
    let page = parseInt(req.query.page) || 1;
    let limit = parseInt(req.query.limit) || 5;

    page = page < 1 ? 1 : page;
    limit = limit > 50 ? 50 : limit;

    const search = (req.query.search || "").trim();

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(filter).skip(skip).limit(limit),
      User.countDocuments(filter),
    ]);

    res.json({
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
      data: users,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post("/api/users", async (req, res) => {
  try {
    let { name, age, email, address } = req.body;

    name = name?.trim();
    email = email?.trim();
    address = address?.trim();

    if (!name || !email || age == null) {
      return res.status(400).json({ error: "Thiếu thông tin bắt buộc" });
    }

    age = parseInt(age);
    if (isNaN(age) || age < 0) {
      return res.status(400).json({ error: "Tuổi không hợp lệ" });
    }

    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã tồn tại" });
    }

    const newUser = await User.create({ name, age, email, address });
    res.status(201).json({
      message: "Tạo người dùng thành công",
      data: newUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.put("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const { name, age, email, address } = req.body;
    const updateData = {};

    if (name !== undefined) updateData.name = name.trim();
    if (age !== undefined) {
      const parsedAge = parseInt(age);
      if (isNaN(parsedAge) || parsedAge < 0) {
        return res.status(400).json({ error: "Tuổi không hợp lệ" });
      }
      updateData.age = parsedAge;
    }
    if (email !== undefined) updateData.email = email.trim();
    if (address !== undefined) updateData.address = address.trim();

    const updatedUser = await User.findByIdAndUpdate(id, updateData, {
      new: true,
      runValidators: true,
    });

    if (!updatedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    res.json({
      message: "Cập nhật người dùng thành công",
      data: updatedUser,
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.delete("/api/users/:id", async (req, res) => {
  try {
    const { id } = req.params;
    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res.status(400).json({ error: "ID không hợp lệ" });
    }

    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
