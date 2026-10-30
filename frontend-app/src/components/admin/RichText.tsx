'use client';

import { useEffect, useRef } from 'react';
import Script from 'next/script';
import { uploadImage } from '@/lib/admin/client';

declare global {
  interface Window {
    tinymce?: any;
  }
}

// Same TinyMCE Cloud build the old admin loaded.
const TINY_SRC = 'https://cdn.tiny.cloud/1/eqzisks4v6u74j9qp4bui994k8q8u6xwy33j0yut4mn1ma71/tinymce/6/tinymce.min.js';

/** TinyMCE editor. `value` is read once on mount (and when `resetKey` changes); edits flow out via onChange. */
export default function RichText({
  value,
  onChange,
  imageType,
  height = 380,
  simple = false,
}: {
  value: string;
  onChange: (html: string) => void;
  imageType: 'event' | 'news' | 'avatar';
  height?: number;
  /** Text formatting only (no images, tables or source view). */
  simple?: boolean;
}) {
  const ref = useRef<HTMLTextAreaElement>(null);
  const editorRef = useRef<any>(null);
  const initial = useRef(value);
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;

  function init() {
    if (!window.tinymce || !ref.current || editorRef.current) return;
    window.tinymce.init({
      target: ref.current,
      height,
      menubar: false,
      skin: 'oxide',
      content_css: 'default',
      content_style: 'body{font-family:system-ui,sans-serif;font-size:15px;color:#10231A}',
      plugins: simple ? 'lists link autoresize' : 'lists link image table code autoresize',
      toolbar: simple ? 'undo redo | bold italic underline | bullist numlist | link' : 'undo redo | blocks | bold italic underline | bullist numlist | link image table | code',
      images_upload_handler: async (blob: any) => uploadImage(imageType, new File([blob.blob()], blob.filename(), { type: blob.blob().type })),
      setup: (ed: any) => {
        editorRef.current = ed;
        ed.on('init', () => ed.setContent(initial.current || ''));
        ed.on('change input undo redo', () => onChangeRef.current(ed.getContent()));
      },
    });
  }

  useEffect(() => {
    init();
    return () => {
      editorRef.current?.remove();
      editorRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <>
      <Script src={TINY_SRC} strategy="afterInteractive" referrerPolicy="origin" onLoad={init} onReady={init} />
      <textarea ref={ref} defaultValue={value} className="w-full" />
    </>
  );
}
