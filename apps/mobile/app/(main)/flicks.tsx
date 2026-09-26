import { useCallback, useMemo, useRef, useState } from "react";
import { View, FlatList, Dimensions, ViewToken } from "react-native";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { flicksApi } from "@/api/flicks";
import { VideoCard } from "@/components/deck/VideoCard";
import type { Flick } from "@/types/media";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export default function FlicksScreen() {
  const router = useRouter();
  const [activeIndex, setActiveIndex] = useState(0);

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage } = useInfiniteQuery({
    queryKey: ["flicks-feed"],
    queryFn: ({ pageParam }) => flicksApi.getFeed(pageParam, 10),
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
    initialPageParam: 1,
  });

  const flicks = useMemo(() => data?.pages.flatMap((p) => p.flicks) ?? [], [data]);

  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index != null) {
      setActiveIndex(viewableItems[0].index);
      const flick = viewableItems[0].item as Flick;
      flicksApi.trackEvent(flick.id, "flick_viewed").catch(() => {});
    }
  }).current;

  const handleEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  return (
    <View style={{ flex: 1, backgroundColor: "#ffffff" }}>
      <FlatList
        data={flicks}
        keyExtractor={(item) => item.id}
        pagingEnabled
        showsVerticalScrollIndicator={false}
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={handleEndReached}
        onEndReachedThreshold={2}
        renderItem={({ item, index }) => (
          <VideoCard
            flick={item}
            isActive={index === activeIndex}
            onOpenComments={() => router.push(`/flick/${item.id}`)}
          />
        )}
      />
    </View>
  );
}
