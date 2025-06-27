const externalHandler = async (c) => {
  const externalUrl = 'http://user:3004/external/users';
  try {
    logger.info(`Calling external service at ${externalUrl}`);
    const response = await fetch(externalUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch from external service: ${response.statusText}`);
    }
    const data = await response.json();
    return c.json(data);
  } catch (error) {
    logger.error("Error fetching external data", error);
    return c.json({ message: 'Failed to fetch external data', error: error.message }, 500);
  }
}