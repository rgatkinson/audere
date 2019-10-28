// Copyright (c) 2019 by Audere
//
// Use of this source code is governed by an MIT-style license that
// can be found in the LICENSE file distributed with this file.

import {
  ManagedSqlNode,
  SequelizeSourceTable,
  ManagedMaterializedView,
} from "./dataPipeline";

export function getFirebaseDataNodes(
  sourceSchema: string,
  destinationSchema: string
): ManagedSqlNode[] {
  return [
    new SequelizeSourceTable(
      {
        name: `${destinationSchema}.analytics`,
        deps: [],
        spec: `
          select
            id as source_id,
            "createdAt" as source_created,
            "updatedAt" as source_updated,

            event->>'event_date' as event_date,
            event->>'event_timestamp' as event_timestamp,
            event->>'event_name' as event_name,
            event->>'event_previous_timestamp' as event_previous_timestamp,
            event->>'event_value_in_usd' as event_value_usd,
            event->>'event_bundle_sequence_id' as event_bundle_sequence_id,
            event->>'event_server_timestamp_offset' as event_server_timestamp_offset,
            event->>'user_id' as user_id,
            event->>'user_pseudo_id' as user_pseudo_id,
            event->>'user_first_touch_timestamp' as user_first_touch_timestamp,
            event->'user_ltv'->>'revenue' as ltv_revenue,
            event->'user_ltv'->>'currency' as ltv_currency,
            event->'device'->>'category' as device_category,
            event->'device'->>'mobile_brand_name' as mobile_brand_name,
            event->'device'->>'mobile_model_name' as mobile_model_name,
            event->'device'->>'mobile_marketing_name' as mobile_marketing_name,
            event->'device'->>'mobile_os_hardware_model' as mobile_os_hardware_model,
            event->'device'->>'operating_system' as device_operating_system,
            event->'device'->>'operating_system_version' as device_operating_system_version,
            event->'device'->>'vendor_id' as device_vendor_id,
            event->'device'->>'advertising_id' as device_advertising_id,
            event->'device'->>'language' as device_language,
            event->'device'->>'is_limited_ad_tracking' as is_limited_ad_tracking,
            event->'device'->>'time_zone_offset_seconds' as device_time_zone_offset_seconds,
            event->'device'->>'browser' as device_browser,
            event->'device'->>'browser_version' as device_browser_version,
            event->'device'->'web_info'->>'browser' as web_info_browser,
            event->'device'->'web_info'->>'browser_version' as web_info_browser_version,
            event->'device'->'web_info'->>'hostname' as web_info_hostname,
            event->'geo'->>'continent' as continent,
            event->'geo'->>'country' as country,
            event->'geo'->>'region' as region,
            event->'geo'->>'city' as city,
            event->'geo'->>'sub_continent' as sub_continent,
            event->'geo'->>'metro' as metro,
            event->'app_info'->>'id' as app_info_id,
            event->'app_info'->>'version' as app_info_version,
            event->'app_info'->>'install_store' as install_store,
            event->'app_info'->>'firebase_app_id' as firebase_app_id,
            event->'app_info'->>'install_source' as install_source,
            event->'traffic_source'->>'name' as traffic_source_name,
            event->'traffic_source'->>'medium' as traffic_source_medium,
            event->'traffic_source'->>'source' as traffic_source,
            event->>'stream_id' as stream_id,
            event->>'platform' as platform,
            event->'event_dimensions'->>'hostname' as hostname
          from ${sourceSchema}.firebase_analytics
        `,
      },
      {
        tableName: `${sourceSchema}.firebase_analytics`,
        id: "source_id",
        timestamp: "source_updated",
      }
    ),

    new ManagedMaterializedView({
      name: `${destinationSchema}.analytics_event_params`,
      deps: [`${destinationSchema}.analytics`],
      spec: `
        select
          a.id,
          a."createdAt",
          a."updatedAt",

          e->>'key' as key,
          coalesce(e->'value'->>'string_value', e->'value'->>'int_value', e->'value'->>'float_value', e->'value'->>'double_value') as value
        from
          ${sourceSchema}.firebase_analytics a,
          jsonb_array_elements(a.event->'event_params') e
      `,
    }),

    new ManagedMaterializedView({
      name: `${destinationSchema}.analytics_user_properties`,
      deps: [`${destinationSchema}.analytics`],
      spec: `
        select
          a.id,
          a."createdAt",
          a."updatedAt",

          u->>'key' as key,
          coalesce(u->'value'->>'string_value', u->'value'->>'int_value', u->'value'->>'float_value', u->'value'->>'double_value') as value,
          u->'value'->>'set_timestamp_micros' as set_timestamp
        from
          ${sourceSchema}.firebase_analytics a,
          jsonb_array_elements(a.event->'user_properties') u
      `,
    }),
  ];
}
