export interface ReplacerForm {
  action: 'replace' | 'hide';
  from: string;
  to: string;
}

export interface ImageSize {
  fullUrl: string;
  relativeUrl: string;
  width: number;
  height: number;
}

export interface ImageFullMeta {
  origin: ImageSize;
  thumb: ImageSize;
}

export interface ReplacerMeta {
  id: string;
  form: ReplacerForm;
  metaFrom: ImageFullMeta;
  metaTo: ImageFullMeta | null;
}

export type MediaUrlStatus = 'unknown' | 'valid' | 'invalid';
