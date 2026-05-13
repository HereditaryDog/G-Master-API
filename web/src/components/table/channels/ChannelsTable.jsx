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

import React, { useMemo } from 'react';
import { Empty } from '@douyinfe/semi-ui';
import CardTable from '../../common/ui/CardTable';
import {
  IllustrationNoResult,
  IllustrationNoResultDark,
} from '@douyinfe/semi-illustrations';
import { getChannelsColumns } from './ChannelsColumnDefs';

const SERVER_SORTABLE_COLUMN_KEYS = new Set([
  'id',
  'name',
  'priority',
  'balance',
  'response_time',
]);

const getSemiSortOrder = (channelSortConfig, columnKey) => {
  if (channelSortConfig?.sortBy !== columnKey) {
    return false;
  }
  return channelSortConfig.sortOrder === 'asc' ? 'ascend' : 'descend';
};

const ChannelsTable = (channelsData) => {
  const {
    channels,
    loading,
    searching,
    activePage,
    pageSize,
    channelCount,
    enableBatchDelete,
    compactMode,
    visibleColumns,
    channelSortConfig,
    setSelectedChannels,
    handlePageChange,
    handlePageSizeChange,
    handleTableChange,
    handleRow,
    t,
    COLUMN_KEYS,
    // Column functions and data
    updateChannelBalance,
    manageChannel,
    manageTag,
    submitTagEdit,
    testChannel,
    setCurrentTestChannel,
    setShowModelTestModal,
    setEditingChannel,
    setShowEdit,
    setShowEditTag,
    setEditingTag,
    copySelectedChannel,
    refresh,
    checkOllamaVersion,
    // Multi-key management
    setShowMultiKeyManageModal,
    setCurrentMultiKeyChannel,
    openUpstreamUpdateModal,
    detectChannelUpstreamUpdates,
  } = channelsData;

  // Get all columns
  const allColumns = useMemo(() => {
    return getChannelsColumns({
      t,
      COLUMN_KEYS,
      updateChannelBalance,
      manageChannel,
      manageTag,
      submitTagEdit,
      testChannel,
      setCurrentTestChannel,
      setShowModelTestModal,
      setEditingChannel,
      setShowEdit,
      setShowEditTag,
      setEditingTag,
      copySelectedChannel,
      refresh,
      activePage,
      channels,
      checkOllamaVersion,
      setShowMultiKeyManageModal,
      setCurrentMultiKeyChannel,
      openUpstreamUpdateModal,
      detectChannelUpstreamUpdates,
    });
  }, [
    t,
    COLUMN_KEYS,
    updateChannelBalance,
    manageChannel,
    manageTag,
    submitTagEdit,
    testChannel,
    setCurrentTestChannel,
    setShowModelTestModal,
    setEditingChannel,
    setShowEdit,
    setShowEditTag,
    setEditingTag,
    copySelectedChannel,
    refresh,
    activePage,
    channels,
    checkOllamaVersion,
    setShowMultiKeyManageModal,
    setCurrentMultiKeyChannel,
    openUpstreamUpdateModal,
    detectChannelUpstreamUpdates,
  ]);

  // Filter columns based on visibility settings
  const getVisibleColumns = () => {
    return allColumns.filter((column) => visibleColumns[column.key]);
  };

  const visibleColumnsList = useMemo(() => {
    return getVisibleColumns();
  }, [visibleColumns, allColumns]);

  const tableColumns = useMemo(() => {
    const columns = compactMode
      ? visibleColumnsList.map(({ fixed, ...rest }) => rest)
      : visibleColumnsList;

    return columns.map((column) => {
      if (!SERVER_SORTABLE_COLUMN_KEYS.has(column.key)) {
        return column;
      }
      return {
        ...column,
        sorter: true,
        sortOrder: getSemiSortOrder(channelSortConfig, column.key),
      };
    });
  }, [compactMode, visibleColumnsList, channelSortConfig]);

  return (
    <CardTable
      columns={tableColumns}
      dataSource={channels}
      scroll={compactMode ? undefined : { x: 'max-content' }}
      pagination={{
        currentPage: activePage,
        pageSize: pageSize,
        total: channelCount,
        pageSizeOpts: [10, 20, 50, 100],
        showSizeChanger: true,
        onPageSizeChange: handlePageSizeChange,
        onPageChange: handlePageChange,
      }}
      hidePagination={true}
      expandAllRows={false}
      onChange={handleTableChange}
      onRow={handleRow}
      rowSelection={
        enableBatchDelete
          ? {
              onChange: (selectedRowKeys, selectedRows) => {
                setSelectedChannels(selectedRows);
              },
            }
          : null
      }
      empty={
        <Empty
          image={<IllustrationNoResult style={{ width: 150, height: 150 }} />}
          darkModeImage={
            <IllustrationNoResultDark style={{ width: 150, height: 150 }} />
          }
          description={t('搜索无结果')}
          style={{ padding: 30 }}
        />
      }
      className='rounded-xl overflow-hidden'
      size='middle'
      loading={loading || searching}
    />
  );
};

export default ChannelsTable;
