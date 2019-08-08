from airflow import DAG
from airflow.contrib.operators import kubernetes_pod_operator
from datetime import datetime

default_args = {
  'start_date': datetime(2019, 1, 1)
}

dag = DAG(
  dag_id='cough_aspren_import',
  schedule_interval=None,
  default_args=default_args
)

import_aspren_files = kubernetes_pod_operator.KubernetesPodOperator(
  task_id='import-analytics-tables',
  name='import-analytics-tables',
  namespace='default',
  image='cough-data:latest',
  cmds=['node'],
  arguments=['build/index.js', 'analytics'],
  env_vars={'NONPII_DATABASE_URL': 'postgres://user:pass@host.docker.internal:5432/test_db'},
  cluster_context="docker-desktop",
  config_file="/kube/config",
  dag=dag
)

update_derived = kubernetes_pod_operator.KubernetesPodOperator(
  task_id='update-derived',
  name='update-derived',
  namespace='default',
  image='cough-data:latest',
  cmds=['node'],
  arguments=['build/index.js', 'refresh'],
  env_vars={'NONPII_DATABASE_URL': 'postgres://user:pass@host.docker.internal:5432/test_db'},
  cluster_context="docker-desktop",
  config_file="/kube/config",
  dag=dag
)

import_aspren_files.set_downstream(update_derived)
