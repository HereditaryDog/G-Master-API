/*
Copyright (C) 2025 QuantumNous

This program is free software: you can redistribute it and/or modify
it under the terms of the GNU Affero General Public License as
published by the Free Software Foundation, either version 3 of the
License, or (at your option) any later version.

This program is distributed in the hope that it will be useful,
but WITHOUT ANY WARRANTY; without even the implied warranty of
MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE. See the
GNU Affero General Public License for more details.

You should have received a copy of the GNU Affero General Public License
along with this program. If not, see <https://www.gnu.org/licenses/>.

For commercial licensing, please contact support@quantumnous.com
*/

import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { API, showError } from '../../helpers';
import { ITEMS_PER_PAGE } from '../../constants';
import { useTableCompactMode } from '../common/useTableCompactMode';

const defaultFilters = {
  keyword: '',
  status: '',
};

const buildQuery = (page, pageSize, filters) => {
  const params = new URLSearchParams({
    p: String(page),
    page_size: String(pageSize),
  });
  const keyword = filters.keyword?.trim();
  if (keyword) {
    params.set('keyword', keyword);
  }
  if (filters.status) {
    params.set('status', filters.status);
  }
  return params.toString();
};

export const useOAuthLoginsData = () => {
  const { t } = useTranslation();
  const [compactMode, setCompactMode] = useTableCompactMode('oauth-logins');
  const [oauthLogins, setOAuthLogins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searching, setSearching] = useState(false);
  const [activePage, setActivePage] = useState(1);
  const [pageSize, setPageSize] = useState(ITEMS_PER_PAGE);
  const [total, setTotal] = useState(0);
  const [filters, setFilters] = useState(defaultFilters);

  const setRows = (rows) => {
    setOAuthLogins(
      (rows || []).map((row) => ({
        ...row,
        key: row.session_id,
      })),
    );
  };

  const loadOAuthLogins = async (
    page = activePage,
    size = pageSize,
    nextFilters = filters,
    options = {},
  ) => {
    if (options.searching) {
      setSearching(true);
    } else {
      setLoading(true);
    }
    try {
      const res = await API.get(
        `/api/gaster-code/admin/oauth-logins?${buildQuery(page, size, nextFilters)}`,
      );
      const { success, message, data } = res.data;
      if (success) {
        setActivePage(data.page);
        setTotal(data.total);
        setRows(data.items);
      } else {
        showError(message);
      }
    } catch (error) {
      showError(error.message);
    } finally {
      setLoading(false);
      setSearching(false);
    }
  };

  const searchOAuthLogins = async (nextFilters) => {
    const normalizedFilters = {
      keyword: nextFilters.keyword || '',
      status: nextFilters.status || '',
    };
    setFilters(normalizedFilters);
    await loadOAuthLogins(1, pageSize, normalizedFilters, { searching: true });
  };

  const resetFilters = async () => {
    setFilters(defaultFilters);
    await loadOAuthLogins(1, pageSize, defaultFilters, { searching: true });
  };

  const handlePageChange = (page) => {
    setActivePage(page);
    loadOAuthLogins(page, pageSize, filters).then();
  };

  const handlePageSizeChange = (size) => {
    localStorage.setItem('page-size', String(size));
    setPageSize(size);
    setActivePage(1);
    loadOAuthLogins(1, size, filters).then();
  };

  const refresh = async () => {
    await loadOAuthLogins(activePage, pageSize, filters);
  };

  useEffect(() => {
    loadOAuthLogins(1, pageSize, defaultFilters).then();
  }, []);

  return {
    oauthLogins,
    loading,
    searching,
    activePage,
    pageSize,
    total,
    filters,
    compactMode,
    setCompactMode,
    loadOAuthLogins,
    searchOAuthLogins,
    resetFilters,
    handlePageChange,
    handlePageSizeChange,
    refresh,
    t,
  };
};
