const express = require("express");
const dotenv = require("dotenv");
const connectDB = require("./config/db");
const compression = require("compression");
const cors = require("cors");
const helmet = require("helmet");
const Message = require("./models/Messge");
const { sendChatMail } = require("./controller/users");
const User = require("./models/User");

dotenv.config({ path: "./config/config.env" });
const app = express();
const PORT = process.env.PORT || 8000;

app.use(compression());
if (typeof window === "undefined") {
  global.window = {};
}
connectDB();

app.get("/", (req, res) => {
  res.send("This is Bookxchanger");
});

app.use((req, res, next) => {
  res.append("Access-Control-Allow-Origin", "https://book-exchanger-jk93fkvwr-mayanks-projects-a6ea03be.vercel.app");
  res.append("Access-Control-Allow-Methods", "GET,PUT,POST,DELETE,PATCH");
  res.append(
    "Access-Control-Allow-Headers",
    "authorization,Content-Type,origin, x-requested-with"
  );
  res.append("Access-Control-Allow-Credentials", "true");
  res.append("Origin", "https://book-exchanger-jk93fkvwr-mayanks-projects-a6ea03be.vercel.app");
  res.append("Access-Control-Max-Age", "86400");
  next();
});

app.use("/books/", require("./routes/books"));
app.use("/users/", require("./routes/users"));

var server = app.listen(PORT, () =>
  console.log(
    `Server running in ${process.env.NODE_ENV} mode on port ${process.env.PORT}`
  )
);

options = {
  cors: true,
  origins: ["https://book-exchanger-jk93fkvwr-mayanks-projects-a6ea03be.vercel.app"],
};
const io = require("socket.io")(server, options);

io.on("connection", async (socket) => {
  socket.on("disconnect", () => {});

  socket.on("landing_page", (data) => {});

  socket.on("login", (data) => {
    if (!socket.rooms.has(data.id)) {
      socket.join(data.id);
    } else {
    }
  });

  socket.on("logout", (data) => {
    socket.leave(data.id);
  });

  socket.on("join", async (data) => {
    var messages = await Message.find({
      $or: [
        { from: data.id, to: data.receiver },
        { from: data.receiver, to: data.id },
      ],
    });

    socket.emit("initial_msgs", messages);
  });

  socket.on("message", async (msg) => {
    try {
      const message = new Message({
        from: msg.from,
        to: msg.to,
        content: msg.content,
        fromName: msg.fromName,
        sentAt: Date.now(),
      });
      await message.save();
      if (socket.adapter.rooms.has(msg.to)) {
        await io.sockets.in(msg.from).emit("send_msg", {
          content: message.content,
          from: message.from,
          to: message.to,
          fromName: msg.fromName,
          sentAt: message.sentAt,
        });
        await io.sockets.in(msg.to).emit("send_msg", {
          content: message.content,
          from: message.from,
          to: message.to,
          fromName: msg.fromName,
          sentAt: message.sentAt,
        });
      } else {
        await io.sockets.in(msg.from).emit("send_msg", {
          content: message.content,
          from: message.from,
          to: message.to,
          fromName: msg.fromName,
          sentAt: message.sentAt,
        });
        const receiver = await User.findById(message.to);
        await sendChatMail(
          receiver.email,
          receiver.name,
          message.fromName,
          `https://book-exchanger-jk93fkvwr-mayanks-projects-a6ea03be.vercel.app/user/${message.from}`
        );
      }
    } catch (err) {}
  });
});
