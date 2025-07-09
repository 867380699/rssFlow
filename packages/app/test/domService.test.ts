/**
 * @vitest-environment jsdom
 */

import { describe, expect, it } from 'vitest';

import { sanitize } from '@/service/domService';

describe('domService', () => {
  it('flat image link', () => {
    const html = `<a href="https://rss.example"><img src="https://img.example/image.png"/></a>`;
    const result = sanitize(html);
    console.log(result);
    expect(result).toBe(
      `<img src="https://img.example/image.png"><a href="https://rss.example">https://rss.example</a>`
    );
  });
  it('remove duplicate br', () => {
    const html = `<br><br><br>`;
    const result = sanitize(html);
    console.log(result);
    expect(result).toBe('<br>');
  });
  it('remove empty p', () => {
    const html = `<p></p><p>not empty</p><p></p>`;
    const result = sanitize(html);
    console.log(result);
    expect(result).toBe('<p>not empty</p>');
  });
});
