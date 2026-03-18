const createAuthController = ({ authService }) => ({
  registerStudent: async (req, res) => {
    const user = await authService.registerStudent(req.body);
    res.status(201).json({
      message: "Student registered successfully",
      user
    });
  },
  login: async (req, res) => {
    const result = await authService.login(req.body);
    res.json(result);
  }
});

module.exports = {
  createAuthController
};
