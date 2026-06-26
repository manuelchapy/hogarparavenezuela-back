export const healthController = {
  check: (req, res) => {
    res.status(200).json({
      success: true,
      data: {
        service: 'hogarparavenezuela-back',
        status: 'ok',
        timestamp: new Date().toISOString(),
      },
    });
  },
};
