import { ParsedFile } from './types';
/**
 * Parse YAML-like frontmatter from markdown content
 */
export declare function parseFrontmatter(content: string): ParsedFile | null;
/**
 * Recursively find all markdown files in a directory
 */
export declare function findMarkdownFiles(dir: string): string[];
/**
 * Generate a simple hash for change detection
 */
export declare function getContentHash(content: string): string;
