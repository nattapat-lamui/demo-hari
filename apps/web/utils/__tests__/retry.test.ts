import { describe, it, expect, vi, beforeEach } from 'vitest';
import { retryWithBackoff, retryable } from '../retry';

describe('retryWithBackoff', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should return result on first success', async () => {
    const fn = vi.fn().mockResolvedValue('success');

    const promise = retryWithBackoff(fn, { maxRetries: 3 });

    // Fast-forward timers
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it('should retry on failure', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const onRetry = vi.fn();

    const promise = retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelay: 100,
      onRetry,
    });

    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledTimes(3);
    expect(onRetry).toHaveBeenCalledTimes(2);
  });

  it('should throw after max retries', async () => {
    const error = new Error('persistent failure');
    const fn = vi.fn().mockRejectedValue(error);

    const promise = retryWithBackoff(fn, {
      maxRetries: 2,
      initialDelay: 100,
    });

    await vi.runAllTimersAsync();

    await expect(promise).rejects.toThrow('persistent failure');
    expect(fn).toHaveBeenCalledTimes(3); // Initial + 2 retries
  });

  it('should use exponential backoff', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail 1'))
      .mockRejectedValueOnce(new Error('fail 2'))
      .mockResolvedValue('success');

    const onRetry = vi.fn();

    retryWithBackoff(fn, {
      maxRetries: 3,
      initialDelay: 1000,
      backoffMultiplier: 2,
      onRetry,
    });

    // First retry after ~1000ms
    await vi.advanceTimersByTimeAsync(1500);
    expect(fn).toHaveBeenCalledTimes(2);

    // Second retry after ~2000ms (exponential)
    await vi.advanceTimersByTimeAsync(2500);
    expect(fn).toHaveBeenCalledTimes(3);
  });
});

describe('retryable', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  it('should create a retryable function', async () => {
    const fn = vi
      .fn()
      .mockRejectedValueOnce(new Error('fail'))
      .mockResolvedValue('success');

    const retryableFn = retryable(fn, { maxRetries: 2, initialDelay: 100 });

    const promise = retryableFn('arg1', 'arg2');
    await vi.runAllTimersAsync();
    const result = await promise;

    expect(result).toBe('success');
    expect(fn).toHaveBeenCalledWith('arg1', 'arg2');
    expect(fn).toHaveBeenCalledTimes(2);
  });

  it('should preserve function arguments', async () => {
    const fn = vi.fn().mockResolvedValue('success');
    const retryableFn = retryable(fn, { maxRetries: 1 });

    await vi.runAllTimersAsync();
    await retryableFn('test', 123, { key: 'value' });

    expect(fn).toHaveBeenCalledWith('test', 123, { key: 'value' });
  });
});
