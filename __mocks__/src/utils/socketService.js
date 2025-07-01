export const io = {
  to: jest.fn().mockReturnValue({
    emit: jest.fn()
  })
};

export const emitEvent = jest.fn();
