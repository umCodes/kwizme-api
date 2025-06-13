
declare module "pdf-poppler" {
  export interface ConvertOptions {
    format: string;
    out_dir: string;
    out_prefix: string;
    page?: number | null;
    scale?: number;
    resolution?: number;
  }

  export function convert(pdfFilePath: string, options: ConvertOptions): Promise<void>;
}
