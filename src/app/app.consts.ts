// https://2ch.hk/test/src/123/456789.png => test
export const MEDIA_BOARD_REGEX = /(?<=hk\/|life\/)(.*)(?=\/src)/g;

// https://2ch.hk/test/src/123/456789.png => 123
export const MEDIA_THREAD_REGEX = /(?<=src\/)(.*)(?=\/)/g;

// https://2ch.hk/test/src/123/456789.png => 456789
export const MEDIA_TIMESTAMP_REGEX = /(?<=\/)(\d*)(?=\.)/g;

// https://2ch.hk/test/src/123/456789.png => https://2ch.hk
export const MEDIA_BASE_URL = /https:\/\/(2ch.hk|2ch.life)/g;
