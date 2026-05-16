import Post from "../models/post.model.js";
import User from "../models/user.model.js";

// CREATE POST
export const createPost = async (req, res) => {
  try {
    const { content } = req.body;

    if (!content) {
      return res.status(400).json({ message: "Content required" });
    }

    const post = await Post.create({
      user: req.user.id,
      content,
    });

    // Populate user so frontend can display username immediately
    const populated = await post.populate("user", "username profilePic skills");

    // Return { post } so frontend can access res.data.post
    res.json({ post: populated });
  } catch (error) {
    console.error("CREATE POST ERROR:", error);
    res.status(500).json({ message: "Failed to create post" });
  }
};

// GET ALL POSTS
export const getPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const posts = await Post.find()
      .populate("user", "username profilePic skills")
      .populate("comments.user", "username profilePic")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    // Return { posts } so frontend can access res.data.posts
    res.json({ posts });
  } catch (error) {
    console.error("GET POSTS ERROR:", error);
    res.status(500).json({ message: "Failed to fetch posts" });
  }
};

// LIKE / UNLIKE
export const likePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    const userId = req.user.id;
    const alreadyLiked = post.likes.some((id) => id.toString() === userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter((id) => id.toString() !== userId);
    } else {
      post.likes.push(userId);
    }

    await post.save();

    res.json({ likes: post.likes });
  } catch (error) {
    console.error("LIKE ERROR:", error);
    res.status(500).json({ message: "Like failed" });
  }
};

// COMMENT
export const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text) {
      return res.status(400).json({ message: "Comment required" });
    }

    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    post.comments.push({ user: req.user.id, text });
    await post.save();

    const populated = await post.populate("comments.user", "username profilePic");

    res.json({ comments: populated.comments });
  } catch (error) {
    console.error("COMMENT ERROR:", error);
    res.status(500).json({ message: "Comment failed" });
  }
};

// DELETE POST
export const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ message: "Post not found" });
    }

    if (post.user.toString() !== req.user.id) {
      return res.status(403).json({ message: "Not authorized" });
    }

    await post.deleteOne();
    res.json({ message: "Post deleted" });
  } catch (error) {
    console.error("DELETE POST ERROR:", error);
    res.status(500).json({ message: "Failed to delete post" });
  }
};

// FEED (FOLLOWING USERS POSTS)
export const getFeed = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = 10;

    const user = await User.findById(req.user.id);

    const posts = await Post.find({ user: { $in: user.following } })
      .populate("user", "username profilePic skills")
      .populate("comments.user", "username profilePic")
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit);

    res.json({ posts });
  } catch (error) {
    console.error("FEED ERROR:", error);
    res.status(500).json({ message: "Failed to fetch feed" });
  }
};