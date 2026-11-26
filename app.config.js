module.exports = ({ config }) => {
  if (process.env.HALIDENE_MERCHANT_EXPORT !== '1') return config;

  return {
    ...config,
    experiments: { ...config.experiments, baseUrl: '/uygulama' },
  };
};
