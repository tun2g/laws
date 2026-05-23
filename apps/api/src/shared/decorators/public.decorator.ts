import { SetMetadata } from '@nestjs/common';

export const IS_PUBLIC_KEY = 'isPublic';
/** Marker decorator — routes tagged with @Public() bypass the JWT guard. */
export const Public = () => SetMetadata(IS_PUBLIC_KEY, true);
