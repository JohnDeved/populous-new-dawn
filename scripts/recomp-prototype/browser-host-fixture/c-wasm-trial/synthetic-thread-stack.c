/* Newly authored portability fixture. No original game/runtime includes. */
#define _POSIX_C_SOURCE 200809L
#include <pthread.h>
#include <stdint.h>
#include <stdio.h>
#include <time.h>
#include <errno.h>
#include <stdlib.h>
#include <string.h>

static pthread_mutex_t lock=PTHREAD_MUTEX_INITIALIZER;
static pthread_cond_t changed=PTHREAD_COND_INITIALIZER;
static int entered,ready,finished,failed,returned,tls_ok;
static _Thread_local uint32_t thread_marker;
static void check(int rc){if(rc){fprintf(stderr,"pthread error: %d\n",rc);exit(2);}}
static struct timespec deadline(void){struct timespec t; if(clock_gettime(CLOCK_REALTIME,&t))exit(3);t.tv_sec+=2;return t;}
static int host_wait(int x){
 check(pthread_mutex_lock(&lock));entered=1;check(pthread_cond_broadcast(&changed));
 struct timespec limit=deadline();
 while(!ready){int rc=pthread_cond_timedwait(&changed,&lock,&limit);if(rc==ETIMEDOUT){failed=1;break;}check(rc);}
 int result=failed? -1:x+1;
 check(pthread_mutex_unlock(&lock));return result;
}
static int nested(int x){volatile int preserved=3;return host_wait(x)*preserved;}
static int run_guest_like(int x){volatile int preserved=7;return nested(x)+preserved;}
static void *worker(void *unused){
 (void)unused;thread_marker=41;int result=run_guest_like(5);
 check(pthread_mutex_lock(&lock));tls_ok=(thread_marker==41);returned=result;finished=1;check(pthread_cond_broadcast(&changed));check(pthread_mutex_unlock(&lock));return NULL;
}
int main(int argc,char **argv){
 int notify=argc==1;if(argc>2||(argc==2&&strcmp(argv[1],"timeout")))return 64;
 thread_marker=99;pthread_t id;pthread_attr_t attr;check(pthread_attr_init(&attr));check(pthread_attr_setstacksize(&attr,131072));check(pthread_create(&id,&attr,worker,NULL));check(pthread_attr_destroy(&attr));
 check(pthread_mutex_lock(&lock));struct timespec limit=deadline();
 while(!entered){int rc=pthread_cond_timedwait(&changed,&lock,&limit);if(rc==ETIMEDOUT){fprintf(stderr,"entry timeout\n");exit(4);}check(rc);}
 if(notify){ready=1;check(pthread_cond_broadcast(&changed));}
 check(pthread_mutex_unlock(&lock));check(pthread_join(id,NULL));
 if(!finished||!tls_ok||thread_marker!=99||(notify?(failed||returned!=25):!failed))return 5;
 printf("{\"scope\":\"new synthetic C pthread fixture, not original game\",\"mode\":\"%s\",\"result\":%d,\"tlsIsolated\":true,\"passed\":true}\n",notify?"resume":"timeout",returned);
 check(pthread_cond_destroy(&changed));check(pthread_mutex_destroy(&lock));return 0;
}
