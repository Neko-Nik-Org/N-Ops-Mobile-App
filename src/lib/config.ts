/*
 * Copyright (C) 2026 Neko Nik <nikhil@nekonik.com>
 *
 * This program is free software: you can redistribute it and/or modify
 * it under the terms of the GNU General Public License version 3
 * as published by the Free Software Foundation.
 *
 * This program is distributed in the hope that it will be useful,
 * but WITHOUT ANY WARRANTY; without even the implied warranty of
 * MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
 * GNU General Public License for more details.
 *
 * You should have received a copy of the GNU General Public License
 * version 3 along with this program. If not, see
 * <https://www.gnu.org/licenses/>.
 */

/** Build-time settings. Edit here (no .env tooling in this bare project). */
export const config = {
  /** Server used for typed codes when none is given (e.g. managed cloud). Empty = require one. */
  defaultServer: 'https://main-api.test.nops.app',
  requestTimeoutMs: 15000,
} as const;
