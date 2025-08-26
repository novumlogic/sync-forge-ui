/*
 * Copyright (c) 2025 Novumlogic Technologies Pvt Ltd
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import type ForeignKey from "@dto/foreign_key";

/**
 * Represents a column in a database table.
 */
export default interface TableColumn {
  /**
   * The name of the column in the database table.
   */
  column_name: string;

  /**
   * The data type of the column (e.g., VARCHAR, INT).
   */
  data_type: string;

  /**
   * The default value for the column, if any.
   */
  column_default: string;

  /**
   * Indicates if the column allows NULL values ("YES" or "NO").
   */
  is_nullable: boolean;

  /**
   * Indicates if the column is a primary key ("YES" or "NO").
   */
  is_primary_key: boolean;

  /**
   * Indicates if the column has a UNIQUE constraint ("YES" or "NO").
   */
  is_unique: boolean;

  /**
   * List of foreign key constraints associated with the column.
   */
  foreign_keys: Array<ForeignKey>;

  /**
   * List of check constraints applied to the column.
   */
  check_constraints: Array<string>;
}
