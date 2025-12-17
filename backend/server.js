const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

// Connect to MongoDB
mongoose
    .connect("mongodb+srv://20225288:Ducvippro020!@it4409.m1chsxe.mongodb.net/?appName=IT4409")
    .then(() => console.log('Connected to MongoDB'))
    .catch((err) => console.error('MongoDB error', err));

// Create Schema and Model
const userSchema = new mongoose.Schema({
    name:{
        type: String,
        required: [true, 'Tên không được để trống'],
        minlength: [2, 'Tên phải có ít nhất 2 ký tự']
    },
    age: {
        type: Number,
        required: [true, 'Tuổi không được để trống'],
        min: [0, 'Tuổi phải lớn hơn hoặc bằng 0']
    },
    email: {
        type: String,
        unique: true,
        required: [true, 'Email không được để trống'],
        match: [/^\S+@\S+\.\S+$/, 'Email không hợp lệ']
    },
    address: {
        type: String,
    }
}); 
const User = mongoose.model('User', userSchema);

// API GET
app.get("/api/users", async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 5;
    const search = req.query.search || "";

    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } }
          ]
        }
      : {};

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
        User.find(filter).skip(skip).limit(limit),
        User.countDocuments(filter)
    ]);

    const totalPages = Math.ceil(total / limit);

    res.json({
      page,
      limit,
      total,
      totalPages,
      data: users
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// API POST
app.post("/api/users", async (req, res) => {
  try {
    const { name, age, email, address } = req.body;
    const newUser = await User.create({ name, age, email, address });
    
    res.status(201).json({
      message: "Tạo người dùng thành công",
      data: newUser
    });
  } catch (err) {
    if (err.code === 11000) {
        return res.status(400).json({ error: "Email này đã tồn tại." });
    }
    res.status(400).json({ error: err.message });
  }
});

// API PUT
app.put("/api/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const { name, age, email, address } = req.body;

        const updateData = {};
        if (name) updateData.name = name.trim();
        if (email) updateData.email = email.trim();
        if (address) updateData.address = address.trim();
        if (age !== undefined && age !== "") updateData.age = age; 

        const updatedUser = await User.findByIdAndUpdate(
            id,
            updateData, 
            { 
                new: true,
                runValidators: true
            }
        );

        if (!updatedUser) {
            return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }

        res.json({
            message: "Cập nhật người dùng thành công",
            data: updatedUser
        });

    } catch (err) {
        if (err.code === 11000) {
            return res.status(400).json({ error: "Email này đã được sử dụng bởi người khác." });
        }
        
        if (err.name === 'CastError') {
             return res.status(400).json({ error: "ID người dùng không hợp lệ." });
        }
        res.status(400).json({ error: err.message });
    }
});
// API DELETE
app.delete("/api/users/:id", async (req, res) => {
    try {
        const { id } = req.params;
        const deletedUser = await User.findByIdAndDelete(id);
        if (!deletedUser) {
        return res.status(404).json({ error: "Không tìm thấy người dùng" });
        }
        res.json({ message: "Xóa người dùng thành công" });
    } catch (err) {
        res.status(400).json({ error: err.message });
    }
});

// Start server
app.listen(3001, () => {
    console.log('Server running on http://localhost:3001');
});