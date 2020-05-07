const getRandomInt = (minVal: number, maxVal: number): number => {
  const randVal = Math.random();
  return Math.floor(randVal * (maxVal - minVal + 1) + minVal);
};

export default getRandomInt;
