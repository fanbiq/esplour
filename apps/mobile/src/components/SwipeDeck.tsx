import { useCallback, useMemo, useRef, useState } from "react";
import { ActivityIndicator, Alert, Dimensions, FlatList, Share, StyleSheet, View, ViewToken } from "react-native";
import { useInfiniteQuery, useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "expo-router";
import { flicksApi } from "@/api/flicks";
import { likesApi, swipeApi } from "@/api/media";
import { sessionApi } from "@/api/session";
import { VideoCard } from "./deck/VideoCard";
import { DeckControls } from "./deck/DeckControls";
import { useMovieDetail } from "@/components/movie/MovieDetailProvider";
import type { Flick } from "@/types/media";

const { height: SCREEN_HEIGHT } = Dimensions.get("window");

export function SwipeDeck({ isActive, onActiveBackgroundChange }: { isActive: boolean; onActiveBackgroundChange?: (uri?: string) => void }) {
  const router = useRouter();
  const { openMovie } = useMovieDetail();
  const [activeIndex, setActiveIndex] = useState(0);
  const [followedAuthors, setFollowedAuthors] = useState<Record<string, boolean>>({});
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } = useInfiniteQuery({
    queryKey: ["flicks-feed"],
    queryFn: ({ pageParam }) => flicksApi.getFeed(pageParam, 10),
    initialPageParam: 1,
    getNextPageParam: (lastPage) => (lastPage.hasMore ? lastPage.page + 1 : undefined),
  });
  const flicks = useMemo(() => data?.pages.flatMap((page) => page.flicks) ?? [], [data]);
  const { data: likes } = useQuery({ queryKey: ["likes", "date", "all"], queryFn: () => likesApi.getLikes() });
  const { data: stats } = useQuery({ queryKey: ["session-stats"], queryFn: () => sessionApi.getStats() });
  const swipeMutation = useMutation({ mutationFn: ({ flick, direction }: { flick: Flick; direction: "left" | "right" }) => swipeApi.swipe(flick.movieId ?? flick.id, direction, { Id: flick.movieId ?? flick.id, Name: flick.movieTitle, Overview: flick.caption }, flick.movieMediaType) });
  const undoMutation = useMutation({ mutationFn: (itemId: string) => swipeApi.unswipe(itemId) });
  const viewabilityConfig = useRef({ itemVisiblePercentThreshold: 80 }).current;
  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    const item = viewableItems[0];
    if (item?.index == null) return;
    setActiveIndex(item.index);
    const flick = item.item as Flick;
    onActiveBackgroundChange?.(flick.movieBackdropUrl ?? flick.moviePosterUrl ?? flick.posterUrl);
    flicksApi.trackEvent(flick.id, "flick_viewed").catch(() => undefined);
  }).current;
  const onEndReached = useCallback(() => {
    if (hasNextPage && !isFetchingNextPage) fetchNextPage();
  }, [fetchNextPage, hasNextPage, isFetchingNextPage]);
  const currentFlick = flicks[activeIndex];
  const currentItemId = currentFlick?.movieId ?? currentFlick?.id;
  const currentLiked = Boolean(currentItemId && likes?.some((like: any) => like.Id === currentItemId));
  const leftSwipesRemaining = stats?.mySwipes?.left;
  const rightSwipesRemaining = stats?.mySwipes?.right;
  const swipeCurrent = (direction: "left" | "right") => {
    if (!currentFlick) return;
    swipeMutation.mutate({ flick: currentFlick, direction }, { onError: () => Alert.alert("Couldn't save swipe", "Please try again.") });
  };
  const toggleLike = () => {
    if (!currentItemId) return;
    if (currentLiked) undoMutation.mutate(currentItemId);
    else swipeCurrent("right");
  };
  const shareCurrent = () => {
    if (!currentFlick) return;
    Share.share({ message: `${currentFlick.movieTitle} on fanbiQ` });
  };
  const openActiveMovie = () => {
    if (!currentFlick) return;
    openMovie(currentFlick.movieId ?? currentFlick.id, {
      showLikedBy: false,
      mediaType: currentFlick.movieMediaType,
    });
  };

  if (isLoading) return <View style={styles.loading}><ActivityIndicator color="#171717" size="large" /></View>;

  return (
    <View style={styles.deck}>
      <FlatList
        data={flicks}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.page}>
            <VideoCard
              flick={item}
              isActive={isActive && index === activeIndex}
              isFeedActive={isActive}
              initialIsFollowed={followedAuthors[item.uploader] ?? item.isFollowedByCurrentUser ?? false}
              onFollowStatusChange={(username, isFollowing) => {
                setFollowedAuthors((previous) => ({ ...previous, [username]: isFollowing }));
              }}
              onOpenComments={() => router.push(`/flick/${item.id}`)}
            />
          </View>
        )}
        pagingEnabled
        snapToInterval={SCREEN_HEIGHT}
        decelerationRate="fast"
        showsVerticalScrollIndicator={false}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={viewabilityConfig}
        onEndReached={onEndReached}
        onEndReachedThreshold={2}
        ListFooterComponent={isFetchingNextPage ? <ActivityIndicator color="#171717" /> : null}
      />
      <View style={styles.controls}>
        <DeckControls
          onRewind={openActiveMovie}
          onSwipeLeft={() => swipeCurrent("left")}
          onSwipeRight={() => swipeCurrent("right")}
          onToggleLike={toggleLike}
          onOpenFilter={shareCurrent}
          canRewind={Boolean(currentFlick)}
          isLiked={currentLiked}
          rewindImageUrl={currentFlick?.movieBackdropUrl ?? currentFlick?.moviePosterUrl ?? currentFlick?.posterUrl}
          rewindAriaLabel={currentFlick ? `Open details for ${currentFlick.movieTitle}` : "Open movie details"}
          hasAppliedFilters={false}
          leftSwipesRemaining={leftSwipesRemaining}
          rightSwipesRemaining={rightSwipesRemaining}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  deck: { flex: 1, backgroundColor: "#ffffff" },
  page: { height: SCREEN_HEIGHT, backgroundColor: "#ffffff" },
  loading: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#ffffff" },
  controls: { position: "absolute", left: 0, right: 0, bottom: 28, paddingHorizontal: 16, paddingBottom: 20 },
});