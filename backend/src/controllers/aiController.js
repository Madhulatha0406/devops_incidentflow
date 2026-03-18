const createAIController = ({ aiCorrectionService }) => ({
  analyzeAnswer: async (req, res) => {
    const analysis = aiCorrectionService.analyzeAnswer(req.body);
    res.json({ analysis });
  }
});

module.exports = {
  createAIController
};
