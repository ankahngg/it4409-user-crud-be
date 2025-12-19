const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

mongoose
  .connect("mongodb+srv://20225137:20225137@cluster0.grj01li.mongodb.net/IT4409")
  .then(() => console.log("Connected to MongoDB"))
  .catch((err) => console.error("Connection Error:", err));

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Tên không được để trống"],
    minlength: [2, "Tên phải có ít nhất 2 ký tự"],
  },
  age: {
    type: Number,
    required: [true, "Tuổi không được để trống"],
    min: [0, "Tuổi phải >= 0"],
  },
  email: {
    type: String,
    required: [true, "Email không được để trống"],
    match: [/^\S+@\S+\.\S+$/, "Email không hợp lệ"],
  },
  address: {
    type: String,
  },
});

// Create Model
const User = mongoose.model("User", UserSchema);

// TODO: Implement API endpoints
app.get("/api/users", async (req, res) => {
  try {
    // Lấy query params
    var page = parseInt(req.query.page) || 1;
    var limit = parseInt(req.query.limit) || 5;
    var search = req.query.search || "";

    // Kiểm tra page và limit phải là số dương
    if (page <= 0 || limit <= 0) {
      return res
        .status(400)
        .json({ error: "Page và limit phải là số nguyên dương" });
    }

    // Giới hạn giá trị limit
    const MAX_LIMIT = 50;
    if (limit > MAX_LIMIT) {
      return res
        .status(400)
        .json({ error: `Limit không được vượt quá ${MAX_LIMIT}` });
    }

    // Tạo query filter cho search
    const filter = search
      ? {
          $or: [
            { name: { $regex: search, $options: "i" } },
            { email: { $regex: search, $options: "i" } },
            { address: { $regex: search, $options: "i" } },
          ],
        }
      : {};

    // Tính skip
    const skip = (page - 1) * limit;
    
    Promise.all([
      User.find(filter).skip(skip).limit(limit),
      User.countDocuments(filter)
    ]).then(([users, total]) => {
    const totalPages = Math.ceil(total / limit);
    // Trả về response
      res.json({
        page,
        limit,
        total,
        totalPages,
        data: users,
      });
    })
  }
  catch (err) {
      res.status(400).json({ error: err.message });
    }
});

app.post("/api/users", async (req, res) => {
  try {
    var { name, age, email, address } = req.body;
    
    // Chuẩn hóa dữ liệu
    name = name.trim();
    email = email.trim();
    address = address.trim();
    age = Number(age);

    console.log(name, age, email, address);

    // Kiểm tra dữ liệu hợp lệ

    // Kiểm tra tên
    if (!name || name.length < 2) {
      return res.status(400).json({ error: "Tên phải có ít nhất 2 ký tự" });
    }

    // Kiểm tra age là số nguyên dương
    if (isNaN(age) || age < 0) {
      return res.status(400).json({ error: "Tuổi phải là số >= 0" });
    }

    // Kiểm tra email đã tồn tại chưa
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ error: "Email đã được sử dụng" });
    }

    // Tạo user mới
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
    const { name, age, email, address } = req.body;

    // Kiểm tra id có tồn tại không
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }

    // Chuẩn hóa dữ liệu
    name = name.trim();
    email = email.trim();
    address = address.trim();
    age = Number(age);

    // Gán giá trị user cho các trường null hoặc undefined
    if(!name) name = user.name;
    if(!email) email = user.email;
    if(!address) address = user.address;
    if(age != null) age = user.age;

    // Kiểm tra dữ liệu hợp lệ
    // Kiểm tra tên
    if (!name || name.length < 2) {
      return res.status(400).json({ error: "Tên phải có ít nhất 2 ký tự" });
    }

    // Kiểm tra age là số nguyên dương
    if (isNaN(age) || age < 0) {
      return res.status(400).json({ error: "Tuổi phải là số >= 0" });
    }

    const updatedUser = await User.findByIdAndUpdate(
      id,
      { name, age, email, address },
      { new: true, runValidators: true } // Quan trọng
    );
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
    const deletedUser = await User.findByIdAndDelete(id);
    if (!deletedUser) {
      return res.status(404).json({ error: "Không tìm thấy người dùng" });
    }
    res.json({ message: "Xóa người dùng thành công" });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});
// alo
// Start server
app.listen(3001, () => {
  console.log("Server running on http://localhost:3001");
});
